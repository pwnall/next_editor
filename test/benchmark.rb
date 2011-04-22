#! /usr/bin/env ruby1.8

bench_string = 'boom headshot '
bench_reps = 19
bench_cpm = 530
bench_reload_delay = 3

require 'rubygems'
require 'x_do'

xdo = XDo.new
titles = ['NextEditor Benchmark', 'NextLang', 'VirtualBox']
browser_sets = titles.map { |title| xdo.find_windows(:name => title) }
browser = nil
browser_sets.each do |browsers|
  if browsers.length == 1
    browser = browsers.first
    break
  end
end
unless browser
  print "Wanted 1 window, found #{browser_sets.map(&:length).join(' / ')}!\n"
end

print 'Press Enter to start...'
gets

browser.activate
browser.type_keysequence 'Ctrl+R'
sleep bench_reload_delay

t0 = Time.now
browser.type_string bench_string * bench_reps, 60.0 / bench_cpm
t1 = Time.now
print "Finished in #{'%.2f' % (t1 - t0)}s\n"
