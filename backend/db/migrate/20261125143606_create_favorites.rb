class CreateFavorites < ActiveRecord::Migration[8.1]
  def change
    create_table :favorites do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :program, null: false, foreign_key: { on_delete: :cascade }

      t.timestamps
    end
    # A user can favorite a program only once.
    add_index :favorites, [ :user_id, :program_id ], unique: true
  end
end
