class CreateAccountSuspensions < ActiveRecord::Migration[8.1]
  def change
    # History of account suspensions (spec: アカウント停止状態の状態遷移を記録する).
    # One row per suspension; lifting fills the lifted_* columns. Rows are never deleted.
    create_table :account_suspensions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :suspended_by, null: false, foreign_key: { to_table: :admin_users }
      t.text :reason, null: false
      t.datetime :starts_at, null: false
      t.datetime :ends_at                 # nil = no end date
      t.datetime :lifted_at
      t.references :lifted_by, foreign_key: { to_table: :admin_users }
      t.text :lift_reason

      t.timestamps
    end
    add_index :account_suspensions, [ :user_id, :lifted_at ]
  end
end
