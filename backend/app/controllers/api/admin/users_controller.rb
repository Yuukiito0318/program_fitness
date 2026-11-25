# GET /api/admin/users      ユーザー一覧・検索（20件ずつ）
#   q          ニックネーム（個人情報の閲覧権限がある運営者はメールアドレスも）で部分一致
#   status     active（利用中）/ suspended（停止中）
#   registered_from / registered_to  登録日（YYYY-MM-DD）
#   page
# GET /api/admin/users/:id  ユーザー詳細（閲覧を操作履歴に記録）
#
# Never returned: password digest, session data. Email address and birth date are returned only to
# operators with personal_info_access (spec: 個人情報を閲覧できる管理者を限定する).
module Api
  module Admin
    class UsersController < BaseController
      PER_PAGE = 20

      def index
        users = User.order(created_at: :desc, id: :desc)
        if (q = params[:q].to_s.strip.first(100)).present?
          pattern = "%#{User.sanitize_sql_like(q)}%"
          users = if current_admin.personal_info_access?
            users.where("users.nickname ILIKE :p OR users.email_address ILIKE :p", p: pattern)
          else
            users.where("users.nickname ILIKE :p", p: pattern)
          end
        end
        users = users.suspended if params[:status] == "suspended"
        users = users.not_suspended if params[:status] == "active"
        if (from = parse_date(params[:registered_from]))
          users = users.where(created_at: from.beginning_of_day..)
        end
        if (to = parse_date(params[:registered_to]))
          users = users.where(created_at: ..to.end_of_day)
        end

        total = users.count
        page = [ params[:page].to_i, 1 ].max
        records = users.offset((page - 1) * PER_PAGE).limit(PER_PAGE).to_a
        suspended_ids = AccountSuspension.in_effect.where(user_id: records.map(&:id)).pluck(:user_id).to_set

        render json: {
          users: records.map { |u| user_row_json(u, suspended: suspended_ids.include?(u.id)) },
          total: total,
          page: page,
          per_page: PER_PAGE,
          total_pages: (total.to_f / PER_PAGE).ceil
        }
      end

      def show
        user = User.find_by(id: params[:id])
        return render json: { error: "ユーザーが見つかりません。" }, status: :not_found unless user

        audit!("view_user", user, { personal_info: current_admin.personal_info_access? })
        render json: { user: user_detail_json(user) }
      end

      private
        def parse_date(value)
          Date.iso8601(value.to_s) if value.present?
        rescue Date::Error
          nil
        end

        def user_row_json(user, suspended:)
          row = {
            id: user.id,
            nickname: user.nickname,
            registered_at: user.created_at.iso8601,
            email_verified: user.email_verified?,
            training_years: user.training_years,
            seller_requirements_met: user.seller_requirements[:self_declared_requirements_met],
            status: suspended ? "suspended" : "active"
          }
          row[:email_address] = user.email_address if current_admin.personal_info_access?
          row
        end

        def user_detail_json(user)
          active = user.active_suspension
          detail = user_row_json(user, suspended: active.present?).merge(
            bio: user.bio,
            training_started_on: user.training_started_on&.strftime("%Y-%m"),
            seller_requirements: user.seller_requirements,
            programs: {
              total: user.programs.count,
              published: user.programs.published.count,
              draft: user.programs.draft.count
            },
            active_suspension: active && suspension_json(active),
            suspensions: user.account_suspensions.includes(:suspended_by, :lifted_by).map { |s| suspension_json(s) }
          )
          if current_admin.personal_info_access?
            detail[:birth_date] = user.birth_date&.iso8601
            detail[:age] = user.age
          end
          detail[:personal_info_visible] = current_admin.personal_info_access?
          detail[:can_manage] = current_admin.user_management_access?
          detail
        end

        def suspension_json(s)
          {
            id: s.id,
            user_reason: s.user_reason,       # shown to the user in the email
            internal_note: s.internal_note,   # operators only
            starts_at: s.starts_at.iso8601,
            ends_at: s.ends_at&.iso8601,
            suspended_by: s.suspended_by.name,
            lifted_at: s.lifted_at&.iso8601,
            lifted_by: s.lifted_by&.name,
            lift_reason: s.lift_reason,
            in_effect: s.in_effect?
          }
        end
    end
  end
end
