class AddPublishedAtToPrograms < ActiveRecord::Migration[8.1]
  def change
    # When the program became public. Used for "新着順". How a program becomes public
    # (sale start, identity verification) is not implemented yet.
    add_column :programs, :published_at, :datetime
    add_index :programs, [ :status, :published_at ]
  end
end
