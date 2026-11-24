class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email_address, null: false
      t.string :password_digest, null: false
      # Set when the user opens the verification link sent to email_address.
      t.datetime :email_verified_at

      # Profile
      t.string :nickname
      t.text :bio
      # Age is always calculated from birth_date (never stored).
      t.date :birth_date, null: false
      # Training history is stored as the month training started (always the 1st of that month),
      # so the number of years grows automatically.
      t.date :training_started_on, null: false

      t.timestamps
    end
    add_index :users, :email_address, unique: true
  end
end
