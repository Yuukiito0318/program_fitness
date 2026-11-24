class CreateProgramDays < ActiveRecord::Migration[8.1]
  def change
    # One training day of the split (e.g. "Day1 胸・三頭").
    create_table :program_days do |t|
      t.references :program, null: false, foreign_key: { on_delete: :cascade }
      t.integer :position, null: false
      t.string :name, null: false
      t.text :note

      t.timestamps
    end
    add_index :program_days, [ :program_id, :position ]
  end
end
