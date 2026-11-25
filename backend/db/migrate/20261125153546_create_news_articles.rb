class CreateNewsArticles < ActiveRecord::Migration[8.1]
  def change
    # Training news / competition info written by operators (spec: 運営作成の筋トレニュース・大会情報).
    create_table :news_articles do |t|
      t.string :title, null: false
      t.text :body, null: false              # plain text (line breaks kept; never rendered as HTML)
      t.string :category, null: false
      t.string :status, null: false, default: "draft"   # draft = 非公開 / published = 公開中
      # Set automatically the first time the article is published (scheduled publishing is out of scope).
      t.datetime :published_at
      t.references :created_by, null: false, foreign_key: { to_table: :admin_users }
      t.references :updated_by, null: false, foreign_key: { to_table: :admin_users }

      t.timestamps
    end
    add_index :news_articles, [ :status, :published_at ]
  end
end
