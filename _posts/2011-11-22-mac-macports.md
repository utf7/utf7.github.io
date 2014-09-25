---
layout:         post
title:          mac 安装 macPorts
description:    mac 下安装 MacPorts 的方法。
keywords: mac, MacPorts, install MacPorts
---
这里只介绍通过 Source 来安装的方法
<pre class="js" name="colorcode">
//下载 MacPorts
wget http://distfiles.macports.org/MacPorts/MacPorts-1.9.2.tar.gz
//解压
tar zxvf MacPorts-1.9.2.tar.gz
//到相应的文件里
cd MacPorts-1.9.2
//这行配置和安装
./configure && make && sudo make install
//删除安装文件
cd ../
rm -rf MacPorts-1.9.2*
</pre>

###MacPorts 的使用

更新 ports tree 和 MacPorts 版本
<pre class="js" name="colorcode">
sudo port -v selfupdate
</pre>

搜索索引中的软件
<pre class="js" name="colorcode">
port search name //软件名
</pre>
安装新软件
<pre class="js" name="colorcode">
sudo port install name
</pre>
卸载软件
<pre class="js" name="colorcode">
sudo port uninstall name
</pre>
查看更新的软件以及版本
<pre class="js" name="colorcode">
port outdated
</pre>
升级可以更新的软件
<pre class="js" name="colorcode">
sudo port upgrade outdated
</pre>
