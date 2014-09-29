#!/usr/bin/env python
#!-*- coding:utf-8 -*-
#!vim: set ts=4 sw=4 sts=4 tw=100 noet:
# ***************************************************************************
# 
# Copyright (c) 2012 Baidu.com, Inc. All Rights Reserved
# $Id: svn-commit-frequency.py 11766 2012-09-13 12:48:15Z lifeng04 $ 
# 统计提交的频率
# **************************************************************************/



import os
import sys
import re
import subprocess
import logging


__author__ = 'leeight <liyubei@baidu.com>'
__date__ = '2012/08/02 20:59:51'
__revision = '$Revision: 11766 $'


#{{{upload.py
def ErrorExit(msg):
  """Print an error message to stderr and exit."""
  print >>sys.stderr, msg
  sys.exit(1)

# Use a shell for subcommands on Windows to get a PATH search.
use_shell = sys.platform.startswith("win")

def RunShellWithReturnCodeAndStderr(command, print_output=False,
                           universal_newlines=True,
                           env=os.environ):
  """Executes a command and returns the output from stdout, stderr and the return code.

  Args:
    command: Command to execute.
    print_output: If True, the output is printed to stdout.
                  If False, both stdout and stderr are ignored.
    universal_newlines: Use universal_newlines flag (default: True).

  Returns:
    Tuple (stdout, stderr, return code)
  """
  logging.info("Running %s", command)
  env = env.copy()
  env['LC_MESSAGES'] = 'C'
  p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       shell=use_shell, universal_newlines=universal_newlines,
                       env=env)
  if print_output:
    output_array = []
    while True:
      line = p.stdout.readline()
      if not line:
        break
      print line.strip("\n")
      output_array.append(line)
    output = "".join(output_array)
  else:
    output = p.stdout.read()
  p.wait()
  errout = p.stderr.read()
  if print_output and errout:
    print >>sys.stderr, errout
  p.stdout.close()
  p.stderr.close()
  return output, errout, p.returncode

def RunShellWithReturnCode(command, print_output=False,
                           universal_newlines=True,
                           env=os.environ):
  """Executes a command and returns the output from stdout and the return code."""
  out, err, retcode = RunShellWithReturnCodeAndStderr(command, print_output,
                           universal_newlines, env)
  return out, retcode

def RunShell(command, silent_ok=False, universal_newlines=True,
             print_output=False, env=os.environ):
  data, retcode = RunShellWithReturnCode(command, print_output,
                                         universal_newlines, env)
  if retcode:
    ErrorExit("Got error status from %s:\n%s" % (command, data))
  if not silent_ok and not data:
    ErrorExit("No output from %s" % command)
  return data
#}}}

def search_commit_trend(author = None):
  """
  检索提交的趋势，如果author没有赋值的话，返回总体的提交趋势
  """
  args = ['git', 'log', '--format=format:%ci']
  if author is not None:
    args += ['--author=' + author]

  stdoutdata = RunShell(args)

  trends = {}
  for line in stdoutdata.splitlines():
    date = line.split(' ')[0]
    if trends.get(date) is None:
      trends[date] = 1
    else:
      trends[date] += 1

  return trends

def search_committers():
  args = ['git', 'log', '--format=short']

  stdoutdata = RunShell(args)
  committers = map(lambda x : x.split(' ')[1], 
                   filter(lambda x : x.startswith('Author'), stdoutdata.splitlines()))

  return list(set(committers))

def main():
  total = search_commit_trend()
  total = list(set(total.iteritems()))
  total.sort()

  users = {}
  committers = search_committers()
  for committer in committers:
    users[committer] = search_commit_trend(committer)


  print 'var GOOGLE_CHARTS_DATA = ['
  print ['Date', 'Total'] + committers
  # ,["2012-04-17",37,1,2,3,4]
  for date, value in total:
    line = [date, value]
    for committer in committers:
      trend = users[committer]
      if trend.has_key(date):
        line.append(trend[date])
      else:
        line.append(0)
    print ',', line
  print '];'

if __name__ == "__main__":
  main()




