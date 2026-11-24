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
end
