# News written by operators and shown to users (spec: 筋トレニュース・大会情報).
#
# Policy (confirmed):
# - Categories: 筋トレニュース / 大会情報 only.
# - status: draft (非公開) / published (公開中). Only published articles are visible to users.
# - published_at (掲載日時): set on the first publish and kept when unpublished and re-published.
# - content_updated_at (更新日時): set when title / body / category change after the first publish.
#   Shown to users as the update date. Publishing / unpublishing alone does not change it.
# - No deletion: unneeded articles are unpublished.
# - body is plain text. The frontend shows it as text (no HTML), so it cannot inject scripts.
class NewsArticle < ApplicationRecord
  # Spec names "筋トレニュース" and "大会情報". Other categories are not decided yet.
  CATEGORIES = {
    "training" => "筋トレニュース",
    "competition" => "大会情報"
  }.freeze

  TITLE_MAX_LENGTH = 100
  BODY_MAX_LENGTH = 10_000

  belongs_to :created_by, class_name: "AdminUser"
  belongs_to :updated_by, class_name: "AdminUser"

  enum :status, { draft: "draft", published: "published" }, default: "draft", validate: true

  normalizes :title, with: ->(v) { v.strip }
  normalizes :body, with: ->(v) { v.strip }

  validates :title, presence: true, length: { maximum: TITLE_MAX_LENGTH }
  validates :body, presence: true, length: { maximum: BODY_MAX_LENGTH }
  validates :category, inclusion: { in: CATEGORIES.keys }

  before_save :record_content_update_after_publish

  # What users may see. Non-public articles are excluded at the query level.
  scope :publicly_visible, -> { published.where.not(published_at: nil).where(published_at: ..Time.current) }
  scope :newest_first, -> { order(published_at: :desc, id: :desc) }

  def publish!(admin)
    update!(status: :published, published_at: published_at || Time.current, updated_by: admin)
  end

  def unpublish!(admin)
    update!(status: :draft, updated_by: admin)
  end

  # Update date to show users: only when the content was edited after the first publish.
  def public_updated_at
    content_updated_at if published_at && content_updated_at && content_updated_at > published_at
  end

  private
    def record_content_update_after_publish
      return unless published_at_was.present?
      return unless will_save_change_to_title? || will_save_change_to_body? || will_save_change_to_category?

      self.content_updated_at = Time.current
    end
end
