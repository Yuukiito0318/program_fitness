class CreateAdminUsers < ActiveRecord::Migration[8.1]
  def change
    # Operator (運営スタッフ) accounts. Completely separate from `users`:
    # there is no admin flag on users, so a normal user can never become an operator.
    # Accounts are created only from the server command line (rails admin:create).
    create_table :admin_users do |t|
      t.string :email_address, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      # Spec: 個人情報を閲覧できる管理者を限定する（email / birth date are hidden without this）
      t.boolean :personal_info_access, null: false, default: false
      # Spec: 管理者の停止ができる
      t.datetime :disabled_at
      t.datetime :last_login_at

      t.timestamps
    end
    add_index :admin_users, :email_address, unique: true
  end
end
