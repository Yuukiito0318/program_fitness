class AddNewsManagementAndContentUpdatedAt < ActiveRecord::Migration[8.1]
  def change
    # Policy: only operators with the news management permission may create / edit / publish / unpublish news.
    # Default false for everyone (grant with `rails admin:permissions EMAIL=... NEWS=1`).
    add_column :admin_users, :news_management_access, :boolean, null: false, default: false

    # Policy: show the update date to users when the content was edited after it was first published.
    # Publishing / unpublishing alone does not change it.
    add_column :news_articles, :content_updated_at, :datetime
  end
end
