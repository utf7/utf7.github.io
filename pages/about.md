---
layout: page
title: About
description: 大力出奇迹
keywords: utf7, seven
comments: true
menu: 关于
permalink: /about/
---

大力出奇迹。

仰慕「优雅编码的艺术」。

## 坚持

* 做好人，做好事
* 勤于思考

## 联系

* GitHub：[@mzlogin](https://github.com/utf7)
* 博客：[{{ site.title }}]({{ site.url }})
* 微博: [@mzlogin](http://weibo.com/chenyechao)

## Skill Keywords

#### Software Engineer Keywords
<div class="btn-inline">
    {% for keyword in site.skill_programing_keywords %}
    <button class="btn btn-outline" type="button">{{ keyword }}</button>
    {% endfor %}
</div>

#### Database and Big Data Keywords
<div class="btn-inline">
    {% for keyword in site.skill_big_data_keywords %}
    <button class="btn btn-outline" type="button">{{ keyword }}</button>
    {% endfor %}
</div>
