# POST   /api/admin/users/:user_id/suspension  アカウント停止 { user_reason, internal_note?, ends_at? }
# DELETE /api/admin/users/:user_id/suspension  停止解除   { reason }
#
# Requires the user management permission (checked on the server).
# Records who / whom / when / why (account_suspensions + admin_audit_logs) and notifies the user by email.
# The email contains user_reason and the period, never internal_note.
module Api
  module Admin
    class SuspensionsController < BaseController
      before_action :require_user_management_access!
      before_action :set_user

      def create
        if @user.suspended?
          return render json: { error: "このユーザーはすでに停止中です。" }, status: :conflict
        end

        ends_at = parse_time(params[:ends_at])
        if params[:ends_at].present? && ends_at.nil?
          return render json: { errors: { "ends_at" => [ "停止期限の形式が正しくありません" ] } }, status: :unprocessable_content
        end
        if ends_at && ends_at <= Time.current
          return render json: { errors: { "ends_at" => [ "停止期限は現在より後の日時にしてください" ] } }, status: :unprocessable_content
        end

        suspension = nil
        ActiveRecord::Base.transaction do
          suspension = @user.account_suspensions.create!(
            suspended_by: current_admin, starts_at: Time.current, ends_at: ends_at,
            user_reason: params[:user_reason].to_s, internal_note: params[:internal_note].to_s
          )
          # Log the user out everywhere immediately.
          @user.sessions.destroy_all
          audit!("suspend_user", @user, { suspension_id: suspension.id, user_reason: suspension.user_reason,
                                          internal_note: suspension.internal_note,
                                          ends_at: suspension.ends_at&.iso8601 })
        end
        AccountMailer.account_suspended(@user, suspension).deliver_later

        render json: { message: "アカウントを停止しました。本人に通知メールを送信します。" }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.to_hash(true) }, status: :unprocessable_content
      end

      def destroy
        suspension = @user.active_suspension
        return render json: { error: "このユーザーは停止中ではありません。" }, status: :conflict unless suspension

        ActiveRecord::Base.transaction do
          suspension.lift!(admin: current_admin, reason: params[:reason].to_s)
          audit!("unsuspend_user", @user, { suspension_id: suspension.id, reason: suspension.lift_reason })
        end
        AccountMailer.account_reinstated(@user).deliver_later

        render json: { message: "アカウントの停止を解除しました。本人に通知メールを送信します。" }
      rescue ActiveRecord::RecordInvalid => e
        errors = e.record.errors.to_hash(true)
        errors["reason"] = errors.delete(:lift_reason) if errors.key?(:lift_reason)
        render json: { errors: errors }, status: :unprocessable_content
      end

      private
        def set_user
          @user = User.find_by(id: params[:user_id])
          render json: { error: "ユーザーが見つかりません。" }, status: :not_found unless @user
        end

        def parse_time(value)
          Time.zone.iso8601(value.to_s) if value.present?
        rescue ArgumentError
          begin
            Time.zone.parse(value.to_s)
          rescue ArgumentError
            nil
          end
        end
    end
  end
end
