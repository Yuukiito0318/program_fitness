# Operator action log (spec: 管理者が誰の、どのデータに、いつ、何を行ったか記録する).
# Append-only: records are never updated or deleted by the application.
class AdminAuditLog < ApplicationRecord
  ACTIONS = {
    "admin_login" => "運営者ログイン",
    "view_user" => "ユーザー詳細の閲覧",
    "suspend_user" => "アカウント停止",
    "unsuspend_user" => "アカウント停止解除",
    "create_news" => "ニュース作成",
    "update_news" => "ニュース編集",
    "publish_news" => "ニュース公開",
    "unpublish_news" => "ニュース非公開"
  }.freeze

  belongs_to :admin_user
  belongs_to :target, polymorphic: true, optional: true

  validates :action, inclusion: { in: ACTIONS.keys }

  before_update { raise ActiveRecord::ReadOnlyRecord, "audit logs are append-only" }
  before_destroy { raise ActiveRecord::ReadOnlyRecord, "audit logs are append-only" }

  def self.record!(admin:, action:, target: nil, metadata: {}, ip_address: nil)
    create!(admin_user: admin, action: action, target: target, metadata: metadata, ip_address: ip_address)
  end

  def action_label
    ACTIONS[action]
  end
end
