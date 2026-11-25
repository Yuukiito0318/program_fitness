require "test_helper"

class ProgramSearchTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @bench = publish(title: "ベンチ強化", category: "power", duration_value: 8, duration_unit: "week",
                     price: 3000, exercise: "ベンチプレス", at: 2.days.ago)
    @legs = publish(title: "脚の日", category: "hypertrophy", duration_value: 2, duration_unit: "month",
                    price: 500, exercise: "スクワット", at: 1.day.ago)
    @draft = @user.programs.create!(title: "ベンチ下書き", category: "power", price: 1000)
  end

  test "drafts are never returned" do
    assert_not_includes Program.search({}), @draft
    assert_not_includes Program.search(q: "ベンチ"), @draft
  end

  test "newest first" do
    assert_equal [ @legs, @bench ], Program.search({}).to_a
  end

  test "keyword matches title and exercise names, multiple words are AND" do
    assert_equal [ @bench ], Program.search(q: "ベンチ").to_a
    assert_equal [ @legs ], Program.search(q: "スクワット").to_a
    assert_empty Program.search(q: "ベンチ スクワット")
  end

  test "keyword with LIKE wildcards is treated literally" do
    assert_empty Program.search(q: "%")
    assert_empty Program.search(q: "_")
  end

  test "filters by category, duration unit/range and price range" do
    assert_equal [ @bench ], Program.search(category: "power").to_a
    assert_equal [ @bench ], Program.search(duration_unit: "week", duration_min: 4, duration_max: 8).to_a
    assert_empty Program.search(duration_unit: "week", duration_max: 4)
    assert_equal [ @legs ], Program.search(price_max: 1000).to_a
    assert_equal [ @bench ], Program.search(price_min: 1000, price_max: 5000).to_a
  end

  test "favorites only for published programs and once per user" do
    assert users(:two).favorites.create(program: @bench).persisted?
    assert_not users(:two).favorites.build(program: @bench).valid?
    assert_not users(:two).favorites.build(program: @draft).valid?
  end

  private
    def publish(title:, exercise:, at:, **attrs)
      program = @user.programs.build(title: title, **attrs)
      program.days.build(position: 1, name: "Day1").exercises.build(position: 1, name: exercise, sets: 3)
      program.status = :published
      program.published_at = at
      program.save!
      program
    end
end
