require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "downcases and strips email_address" do
    user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
    assert_equal("downcased@example.com", user.email_address)
  end

  test "age is calculated from birth_date and changes on the birthday" do
    user = User.new(birth_date: Date.new(2008, 6, 10))
    assert_equal 17, user.age(on: Date.new(2026, 6, 9))
    assert_equal 18, user.age(on: Date.new(2026, 6, 10))
  end

  test "training years are counted in full years from the start month" do
    user = User.new(training_started_on: Date.new(2023, 7, 1))
    assert_equal 2, user.training_years(on: Date.new(2026, 6, 30))
    assert_equal 3, user.training_years(on: Date.new(2026, 7, 1))
  end

  test "seller requirements need both 18+ years old and 3+ years of training" do
    user = User.new(birth_date: Date.new(2008, 6, 10), training_started_on: Date.new(2020, 1, 1))
    on = Date.new(2026, 6, 9) # 17 years old
    assert_not user.seller_requirements(on: on)[:self_declared_requirements_met]

    on = Date.new(2026, 6, 10) # 18 years old
    assert user.seller_requirements(on: on)[:self_declared_requirements_met]
  end
end
