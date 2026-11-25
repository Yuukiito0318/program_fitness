class AccountMailer < ApplicationMailer
  # 新規登録時・再送時：メールアドレス確認
  def email_verification(user)
    @user = user
    @url = frontend_url("/verify-email", token: user.generate_token_for(:email_verification))
    @expires_in_hours = (User::EMAIL_VERIFICATION_EXPIRES_IN / 1.hour).to_i
    mail subject: "【program fitness】メールアドレスの確認", to: user.email_address
  end

  # パスワードを忘れた場合：再設定リンク
  def password_reset(user)
    @user = user
    @url = frontend_url("/reset-password", token: user.generate_token_for(:password_reset))
    @expires_in_minutes = (User::PASSWORD_RESET_EXPIRES_IN / 1.minute).to_i
    mail subject: "【program fitness】パスワード再設定のご案内", to: user.email_address
  end

  # ログイン中のパスワード変更：登録メールアドレスへ通知（仕様で確定）
  def password_changed(user)
    @user = user
    @changed_at = Time.current
    @forgot_url = frontend_url("/forgot-password")
    mail subject: "【program fitness】パスワードが変更されました", to: user.email_address
  end

  # 運営によるアカウント停止：本人へ通知
  # Policy: include the reason for the user (user_reason), the period, and the contact.
  # The operator-only internal_note is never passed to the template.
  def account_suspended(user, suspension)
    @user = user
    @user_reason = suspension.user_reason
    @starts_at = suspension.starts_at
    @ends_at = suspension.ends_at
    @support_contact = support_contact
    mail subject: "【program fitness】アカウントの利用停止のお知らせ", to: user.email_address
  end

  # 運営による停止解除：本人へ通知
  def account_reinstated(user)
    @user = user
    @login_url = frontend_url("/login")
    @support_contact = support_contact
    mail subject: "【program fitness】アカウントの利用停止解除のお知らせ", to: user.email_address
  end

  private
    # Contact shown in account notices. Not decided yet: set SUPPORT_CONTACT in backend/.env
    # (an email address or a URL of the contact page).
    def support_contact
      ENV["SUPPORT_CONTACT"].presence || "（問い合わせ先が未設定です。運営は SUPPORT_CONTACT を設定してください）"
    end
end
