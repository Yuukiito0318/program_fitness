class AddUserManagementAccessToAdminUsers < ActiveRecord::Migration[8.1]
  # Policy: separate "personal information" permission from "normal operations" permission.
  # user_management_access = can suspend / unsuspend user accounts.
  # New operators get no permission by default; existing operators keep what they could do before.
  def up
    add_column :admin_users, :user_management_access, :boolean, null: false, default: false
    execute "UPDATE admin_users SET user_management_access = TRUE"
  end

  def down
    remove_column :admin_users, :user_management_access
  end
end
