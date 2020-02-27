---
layout: post
title: Check out, review, and merge locally
description: Check out, review, and merge locally
categories: [GitHub]
keywords: github
excerpt: Check out, review, and merge locally
---


#  Check out, review, and merge locally

**Step 1.** Fetch and check out the branch for this merge request

`git fetch https://github.com/utf7/utf7.github.io.git abc-branch`  
`git checkout -b utf7/abc-branch FETCH_HEAD`

**Step 2.** Review the changes locally

**Step 3.** Merge the branch and fix any conflicts that come up

git checkout master
git merge --no-ff utf7/abc-branch

**Step 4.** Push the result of the merge to github

git push origin master
Tip: You can also checkout merge requests locally by following these guidelines.
