---
layout: page
title: About
description: 做好人，做好事
keywords: Seven,utf7,HMaster
comments: true
menu: 关于
permalink: /about/
---

喜摇滚，爱编码

## 联系

* GitHub：[@utf7](https://github.com/utf7)
* 博客：[{{ site.title }}]({{ site.url }})
* 微博: [@敌粑咯](http://weibo.com/chenyechao)
* HBase 技术社区: [@hmaster](http://hbase-help.com/?/people/hmaster)


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