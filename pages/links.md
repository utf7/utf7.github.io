---
layout: page
title: 链接
description: 关注渠道与常用入口
keywords: utf7, 链接, 公众号, GitHub
comments: false
menu: 链接
permalink: /links/
---

## 关注我

* [GitHub @utf7](https://github.com/utf7)
* 微信公众号：yechaotalk
* 视频号：程序员乌托邦
* [微博 @utf7](https://weibo.com/chenyechao)
* [关于我](/about/)

## 精选演讲

{% for talk in site.featured_talks %}
* [{{ talk.title }}]({{ talk.url }}){% if talk.event %}（{{ talk.event }}）{% endif %}
{% endfor %}

## 归档

* [原 CSDN 博客](https://blog.csdn.net/seven_3306)
