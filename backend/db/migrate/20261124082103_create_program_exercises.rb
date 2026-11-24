class CreateProgramExercises < ActiveRecord::Migration[8.1]
  def change
    # One exercise in a training day, in order (種目順).
    create_table :program_exercises do |t|
      t.references :program_day, null: false, foreign_key: { on_delete: :cascade }
      t.integer :position, null: false
      t.string :name, null: false    # 種目名
      t.integer :sets                # セット数
      t.string :reps                 # 回数（"8〜10" や "AMRAP" も可）
      t.string :weight               # 重量（"80kg" や "1RMの75%" も可）
      t.string :rest                 # 休憩（任意）
      t.text :note                   # メモ（任意）

      t.timestamps
    end
    add_index :program_exercises, [ :program_day_id, :position ]
  end
end
