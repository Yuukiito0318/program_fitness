require "test_helper"

class ProgramTest < ActiveSupport::TestCase
  setup { @user = users(:one) }

  test "a draft needs only a title" do
    program = @user.programs.build(title: "下書き")
    assert program.valid?
    assert program.draft?
  end

  test "category must be power, hypertrophy or balance" do
    assert @user.programs.build(title: "t", category: "hypertrophy").valid?
    assert_not @user.programs.build(title: "t", category: "cardio").valid?
  end

  test "duration is 1-12 weeks or 1-3 months" do
    assert @user.programs.build(title: "t", duration_value: 12, duration_unit: "week").valid?
    assert @user.programs.build(title: "t", duration_value: 3, duration_unit: "month").valid?
    assert_not @user.programs.build(title: "t", duration_value: 13, duration_unit: "week").valid?
    assert_not @user.programs.build(title: "t", duration_value: 4, duration_unit: "month").valid?
    assert_not @user.programs.build(title: "t", duration_value: 0, duration_unit: "week").valid?
    assert_not @user.programs.build(title: "t", duration_value: 2).valid?, "unit is required with a value"
  end

  test "price is 100-100,000 yen" do
    assert @user.programs.build(title: "t", price: 100).valid?
    assert @user.programs.build(title: "t", price: 100_000).valid?
    assert_not @user.programs.build(title: "t", price: 99).valid?
    assert_not @user.programs.build(title: "t", price: 100_001).valid?
  end

  test "saves days and exercises in order and reports missing items" do
    program = @user.programs.build(title: "胸の日")
    day = program.days.build(position: 1, name: "Day1 胸")
    day.exercises.build(position: 1, name: "ベンチプレス", sets: 5, reps: "5", weight: "80kg")
    day.exercises.build(position: 2, name: "ダンベルフライ", sets: 3, reps: "10〜12")
    assert program.save

    program.reload
    assert_equal %w[ベンチプレス ダンベルフライ], program.days.first.exercises.map(&:name)
    assert_not_includes program.missing_items, "トレーニング日と種目"
    assert_includes program.missing_items, "販売価格"
  end

  test "invalid exercise sets make the program invalid" do
    program = @user.programs.build(title: "t")
    program.days.build(position: 1, name: "Day1").exercises.build(position: 1, name: "スクワット", sets: 0)
    assert_not program.valid?
  end
end
