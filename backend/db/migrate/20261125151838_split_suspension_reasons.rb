class SplitSuspensionReasons < ActiveRecord::Migration[8.1]
  # Policy: the suspension email tells the user the reason meant for them; operator-only notes are never sent.
  # The old single `reason` column was entered as an internal note (it was never emailed),
  # so existing values are kept as internal_note. Nothing is deleted.
  def change
    rename_column :account_suspensions, :reason, :internal_note
    change_column_null :account_suspensions, :internal_note, true
    # Reason shown to the user in the notification email. Required for new suspensions (model validation);
    # nullable only because suspensions created before this change do not have one.
    add_column :account_suspensions, :user_reason, :text
  end
end
