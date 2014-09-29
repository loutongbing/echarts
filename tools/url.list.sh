#!/usr/bin/env bash

base_dir=`dirname $0`
find ${base_dir}/../.. -name "*.java" | xargs -i grep -r "@Action" {} | awk -F'"' '{print $2}' | sort | uniq
