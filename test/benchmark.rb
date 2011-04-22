#! /usr/bin/env ruby1.8

bench_string = 'boom headshot '
bench_reps = 19
bench_cpm = 530

require 'rubygems'
require 'x_do'

xdo = XDo.new
browsers = xdo.find_windows(:name => 'NextEditor Benchmark')
if browsers.length == 1
  bench_reload_delay = 2
else
  old_length = browsers.length
  browsers = xdo.find_windows(:name => 'NextLang')
  if browsers.length == 1
    bench_reload_delay = 5
  else
    print "Wanted 1 window, found #{old_length} / #{browsers.length}!\n"
    exit
  end
end

browser = browsers.first
print 'Press Enter to start...'
gets

browser.activate
browser.type_keysequence 'Ctrl+R'
sleep bench_reload_delay

t0 = Time.now
browser.type_string bench_string * bench_reps, 60.0 / bench_cpm
t1 = Time.now
print "Finished in #{'%.2f' % (t1 - t0)}s\n"
