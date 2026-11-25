# Development-only helpers to make programs public for checking search and favorites.
#
# The real way to publish (sale start) is NOT implemented: it needs the seller requirements and
# identity verification, and the verification service is not selected (spec). Do not use in production.
#
#   ruby bin/rails dev:publish_program ID=1
#   ruby bin/rails dev:unpublish_program ID=1
namespace :dev do
  def dev_only!
    abort "このタスクは開発環境専用です。" unless Rails.env.development?
  end

  desc "Publish a program for local testing of search/favorites (development only)"
  task publish_program: :environment do
    dev_only!
    program = Program.find_by(id: ENV["ID"]) or abort "ID=<プログラムID> を指定してください。"
    if program.missing_items.any?
      abort "未入力の項目があるため公開できません: #{program.missing_items.join('、')}"
    end

    program.update!(status: :published, published_at: Time.current)
    puts "公開しました: ##{program.id} #{program.title}"
  end

  desc "Return a published program to draft (development only)"
  task unpublish_program: :environment do
    dev_only!
    program = Program.find_by(id: ENV["ID"]) or abort "ID=<プログラムID> を指定してください。"
    program.update!(status: :draft, published_at: nil)
    puts "下書きに戻しました: ##{program.id} #{program.title}"
  end
end
