# Development helper: show the latest email written by ActionMailer's :file delivery.
#   ruby bin/rails dev:last_mail
# The mail delivery service is not selected yet, so emails are saved under tmp/mails/.
namespace :dev do
  desc "Show the latest email saved in tmp/mails (development only)"
  task last_mail: :environment do
    require "mail"

    file = Dir[Rails.root.join("tmp/mails/*")].max_by { |f| File.mtime(f) }
    abort "tmp/mails にメールがありません。" unless file

    # On Windows the :file delivery writes "\r\n" in text mode, producing "\r\r\n".
    raw = File.binread(file).force_encoding("UTF-8").gsub("\r\r\n", "\n").gsub("\r\n", "\n")
    mail = Mail.new(raw.split(/(?=^Date: )/).last)

    puts "To:      #{mail.to&.join(', ')}"
    puts "Subject: #{mail.subject}"
    puts "Date:    #{mail.date}"
    puts "-" * 40
    puts (mail.text_part || mail).decoded.force_encoding("UTF-8")
  end

  desc "Send a test email to check the SMTP settings: rails dev:test_mail TO=you@example.com"
  task test_mail: :environment do
    to = ENV["TO"].presence or abort "宛先を指定してください: ruby bin/rails dev:test_mail TO=you@example.com"
    method = ActionMailer::Base.delivery_method
    puts "delivery_method: #{method}"
    puts "smtp: #{ActionMailer::Base.smtp_settings[:address]}:#{ActionMailer::Base.smtp_settings[:port]}" if method == :smtp

    ActionMailer::Base.mail(
      from: ENV.fetch("MAIL_FROM", "program fitness <no-reply@localhost>"),
      to: to,
      subject: "【program fitness】テストメール",
      body: "program fitness 開発環境からのテストメールです。\nこのメールが届けば SMTP 設定は正しく動作しています。"
    ).deliver_now
    puts method == :smtp ? "送信しました: #{to}（迷惑メールフォルダも確認してください）" : "tmp/mails に保存しました（SMTP_ADDRESS が未設定のため送信していません）"
  rescue Net::SMTPAuthenticationError => e
    abort "SMTP 認証に失敗しました。SMTP_USERNAME と SMTP_PASSWORD（Gmail はアプリパスワード）を確認してください。\n#{e.message}"
  rescue StandardError => e
    abort "送信に失敗しました: #{e.class}: #{e.message}"
  end
end
