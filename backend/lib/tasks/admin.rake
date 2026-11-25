# Operator (運営者) account management from the server command line.
# This is the ONLY way to create an operator: there is no sign-up form or API for it.
#
#   ruby bin/rails admin:create EMAIL=staff@example.com NAME="運営 太郎"   # 権限なし（一覧・詳細の閲覧のみ）
#   ruby bin/rails admin:create EMAIL=... NAME=... MANAGE_USERS=1      # ユーザー運営操作（停止・解除）
#   ruby bin/rails admin:create EMAIL=... NAME=... PERSONAL_INFO=1     # 個人情報の閲覧
#   ruby bin/rails admin:create EMAIL=... NAME=... NEWS=1              # ニュース管理（作成・編集・公開・非公開）
#   ruby bin/rails admin:permissions EMAIL=... MANAGE_USERS=0 PERSONAL_INFO=1   # 権限の変更（指定した項目のみ）
#   ruby bin/rails admin:list
#   ruby bin/rails admin:disable EMAIL=staff@example.com              # 管理者の停止
#   ruby bin/rails admin:enable  EMAIL=staff@example.com
#   ruby bin/rails admin:reset_password EMAIL=staff@example.com
#
# The password is typed in without being shown. (ADMIN_PASSWORD=... is also accepted for
# non-interactive use, but it can remain in shell history — prefer typing it.)
require "io/console"

namespace :admin do
  read_password = lambda do
    if ENV["ADMIN_PASSWORD"].present?
      next ENV["ADMIN_PASSWORD"]
    end
    abort "パスワードを入力できる端末で実行してください（または ADMIN_PASSWORD を指定）。" unless $stdin.tty?

    print "パスワード（#{AdminUser::PASSWORD_MIN_LENGTH}文字以上・表示されません）: "
    first = $stdin.noecho(&:gets).to_s.chomp
    puts
    print "パスワード（確認）: "
    second = $stdin.noecho(&:gets).to_s.chomp
    puts
    abort "パスワードが一致しません。" unless first == second
    first
  end

  find_admin = lambda do
    AdminUser.find_by(email_address: ENV["EMAIL"].to_s.strip.downcase) or abort "EMAIL=<運営者のメールアドレス> を指定してください。"
  end

  permissions_label = lambda do |a|
    yes_no = ->(v) { v ? "あり" : "なし" }
    "ユーザー運営操作:#{yes_no.call(a.user_management_access)}  個人情報:#{yes_no.call(a.personal_info_access)}  " \
      "ニュース管理:#{yes_no.call(a.news_management_access)}"
  end

  desc "Create an operator account: EMAIL=... NAME=... [MANAGE_USERS=1] [PERSONAL_INFO=1] [NEWS=1]"
  task create: :environment do
    email = ENV["EMAIL"].to_s
    name = ENV["NAME"].to_s
    abort "EMAIL と NAME を指定してください。例: ruby bin/rails admin:create EMAIL=staff@example.com NAME=運営太郎" if email.blank? || name.blank?

    password = read_password.call
    admin = AdminUser.new(email_address: email, name: name, password: password, password_confirmation: password,
                          personal_info_access: ENV["PERSONAL_INFO"] == "1",
                          user_management_access: ENV["MANAGE_USERS"] == "1",
                          news_management_access: ENV["NEWS"] == "1")
    if admin.save
      puts "運営者を作成しました: #{admin.email_address}（#{admin.name}） #{permissions_label.call(admin)}"
    else
      abort "作成できませんでした: #{admin.errors.full_messages.join(' / ')}"
    end
  end

  desc "List operator accounts"
  task list: :environment do
    AdminUser.order(:id).each do |a|
      puts [ a.id, a.email_address, a.name, permissions_label.call(a),
             (a.enabled? ? "有効" : "停止中"), "最終ログイン: #{a.last_login_at&.strftime('%Y-%m-%d %H:%M') || '-'}" ].join("  ")
    end
  end

  desc "Change operator permissions: EMAIL=... [MANAGE_USERS=0|1] [PERSONAL_INFO=0|1] [NEWS=0|1]"
  task permissions: :environment do
    admin = find_admin.call
    changes = {}
    { "MANAGE_USERS" => :user_management_access, "PERSONAL_INFO" => :personal_info_access,
      "NEWS" => :news_management_access }.each do |env, column|
      next unless ENV.key?(env)
      abort "#{env} は 0 または 1 で指定してください。" unless %w[0 1].include?(ENV[env])

      changes[column] = ENV[env] == "1"
    end
    abort "MANAGE_USERS / PERSONAL_INFO / NEWS のいずれかを指定してください。" if changes.empty?

    admin.update!(changes)
    puts "権限を変更しました: #{admin.email_address}  #{permissions_label.call(admin)}"
  end

  desc "Disable an operator account (logs them out): EMAIL=..."
  task disable: :environment do
    admin = find_admin.call
    admin.update!(disabled_at: Time.current)
    admin.admin_sessions.destroy_all
    puts "停止しました: #{admin.email_address}"
  end

  desc "Re-enable an operator account: EMAIL=..."
  task enable: :environment do
    admin = find_admin.call
    admin.update!(disabled_at: nil)
    puts "有効にしました: #{admin.email_address}"
  end

  desc "Reset an operator's password (logs them out): EMAIL=..."
  task reset_password: :environment do
    admin = find_admin.call
    password = read_password.call
    if admin.update(password: password, password_confirmation: password)
      admin.admin_sessions.destroy_all
      puts "パスワードを変更しました: #{admin.email_address}"
    else
      abort "変更できませんでした: #{admin.errors.full_messages.join(' / ')}"
    end
  end
end
