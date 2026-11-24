class CreatePrograms < ActiveRecord::Migration[8.1]
  def change
    create_table :programs do |t|
      t.references :user, null: false, foreign_key: true
      # Only "draft" for now. Sale statuses (販売中・販売停止・公開終了) will be added with the sales feature.
      t.string :status, null: false, default: "draft"

      t.string :title, null: false
      t.text :description            # プログラムの内容・説明
      t.text :target_audience        # 対象者
      t.text :equipment              # 必要な器具
      t.string :category             # power / hypertrophy / balance
      t.integer :duration_value      # 期間の数値
      t.string :duration_unit        # week / month
      t.string :split_method         # 分割法（自由入力）
      t.integer :price               # 販売価格（円）。販売機能は未実装

      t.timestamps
    end
    add_index :programs, [ :user_id, :updated_at ]
  end
end
