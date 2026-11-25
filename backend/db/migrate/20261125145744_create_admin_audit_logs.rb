class CreateAdminAuditLogs < ActiveRecord::Migration[8.1]
  def change
    # Spec (操作履歴): 管理者が誰の、どのデータに、いつ、何を行ったか記録する.
    # Append-only: there is no API to edit or delete these rows.
    create_table :admin_audit_logs do |t|
      t.references :admin_user, null: false, foreign_key: true
      t.string :action, null: false
      t.string :target_type
      t.bigint :target_id
      t.jsonb :metadata, null: false, default: {}
      t.string :ip_address
      t.datetime :created_at, null: false
    end
    add_index :admin_audit_logs, [ :target_type, :target_id, :created_at ]
    add_index :admin_audit_logs, :created_at
  end
end
