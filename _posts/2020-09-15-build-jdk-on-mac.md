---
layout: post
title: Mac 上从源代码编译 JDk
description: Mac 上从源代码编译 **JDk**
categories: [Java,mac]
keywords: JDK,JVM,mac
excerpt: Mac 上从源代码编译 JDk
---

最近被问了一个关于`YARN`任务 关于 `JVM` 启动内存参数相关的问题，就上网搜了一下，然后发现网上关于一些`JVM`参数的说法，通常质量都比较低，就想着去看一下 `openjdk` 的代码，`openjdk` 主要是使用 `C++` 写的,虽然没用过C++,但我想一些简单的参数意义从代码中还是能看懂的，同时有感于对 `JVM`一些参数总是一知半解，想通过看代码，可能会加深印象，便于记忆。就像以前做`HBase `一样，各种参数很难记住或者理解不深刻，但是通过实践+看代码的方式，记忆其实是比较深刻的。比如`JDK 8` 模式的 `GC` 既不是 `G1` 也不是`CMS`,并且仔细看的话，`CMS` 在其他版本中从来就没有被当作为默认的 `GC` 方式，当我接触的人中，很多人会有这样的误解，对于 `JDK7/8` 只要不设置为`G1`，就是默认 `CMS`, 其实并不是。于是就在 `github`上面在线看代码，看代码的过程中发现不是很方便，于是就想着把代码下载下来，在 `IDE`中查看，也方便查找，然后就想着如何在 `mac `上面编译一下 `JDK `,于是就有了这篇文章。

编译前一定请认真阅读一下：https://github.com/openjdk/jdk/blob/master/doc/building.md

官方的编译指南。



### 准备源代码

git clone https://github.com/openjdk/jdk.git

我这里编译的是 `JDK11`，所以我  `checkout` 了最新的 `JDK11` 的`tag `

git checkout -b jdk-11+28 jdk-11+28

### 编译所需要安装的软件

brew install autoconf freetype ccache



#### 安装配置Xcode

appstore  安装 xcode

sudo Xcode-select --switch /Applications/Xcode.app/Contents/Developer



#### 安装部署boot-jdk

编译 jdk 源码需要使用boot-jdk，这里我使用的是 adoptopenjdk

下载地址：

https://adoptopenjdk.net/releases.html?variant=openjdk11&jvmVariant=hotspot



tar -zxvf OpenJDK11U-jdk_x64_mac_hotspot_11.0.8_10.tar.gz



#### 安装 jtreg

下载

https://ci.adoptopenjdk.net/view/Dependencies/job/jtreg/lastSuccessfulBuild/artifact/jtreg-5.1-b01.tar.gz



tar -zxvf jtreg-5.1-b01.tar.gz



## 编译



```shell
bash configure --with-boot-jdk=/Users/admin/jdk-11.0.8+10/Contents/Home --with-jvm-variants=server --with-target-bits=64  --enable-dtrace --enable-ccache --with-num-cores=4 --with-memory-size=4096 --with-jtreg=/Users/admin/jtreg --with-freetype=bundled --disable-warnings-as-errors --enable-debug --enable-dtrace
```

![configure](/images/posts/java/build-jdk-config.png)

编译时间挺长的，请耐心等待。

```shell
make images
```

![make-images-output](/images/posts/java/build-jdk-image.jpg)

验证：

编译后的 JDK 路径为：

./build/macosx-x86_64-normal-server-fastdebug/images/jdk/ 

查看版本：

![buidl-jdk-show-version](/images/posts/java/build-jdk-version.png)

### 错误汇总



##### 缺少Xcode 报错：

```verilog
checking for sdk name...
configure: error: No xcodebuild tool and no system framework headers found, use --with-sysroot or --with-sdk-name to provide a path to a valid SDK
/Users/admin/github/jdk/build/.configure-support/generated-configure.sh: line 82: 5: Bad file descriptor
configure exiting with result code 1
```

执行 `xcodebuild` 发现如下错误

```javascript
xcode-select: error: tool 'xcodebuild' requires Xcode, 
but active developer directory 
'/Library/Developer/CommandLineTools' is a command line tools instance
```



##### 缺少boot-jdk 错误

```verilog
configure: Potential Boot JDK found at /Library/Java/JavaVirtualMachines/jdk1.8.0_261.jdk/Contents/Home is incorrect JDK version (java version "1.8.0_261"); ignoring
configure: (Your Boot JDK version must be one of: 10 11)
configure: Could not find a valid Boot JDK. You might be able to fix this by running 'brew cask install java'.
configure: This might be fixed by explicitly setting --with-boot-jdk
configure: error: Cannot continue
/Users/admin/github/jdk/build/.configure-support/generated-configure.sh: line 82: 5: Bad file descriptor
configure exiting with result code 1
```

解决办法参考安装部署 `boot-jdk`，`configure` 配置的时候需要指定 `--with-boot-jdk=/Users/admin/jdk-11.0.8+10/Contents/Home`



##### freetype 配置错误

checking for cups/ppd.h... yes
configure: error: Valid values for --with-freetype are 'system' and 'bundled'
/Users/admin/github/jdk/build/.configure-support/generated-configure.sh: line 82: 5: Bad file descriptor
configure exiting with result code 1

将  `--with-freetype=/usr/local/Cellar/freetype/2.10.2` 修改为`--with-freetype=bundled`



##### 缺少jtreg 报错

```verilog
Test selection 'tier1', will run:
* jtreg:test/hotspot/jtreg:tier1
* jtreg:test/jdk:tier1
* jtreg:test/langtools:tier1
* jtreg:test/jaxp:tier1
* jtreg:test/lib-test:tier1
Error: jtreg framework is not found.
Please run configure using --with-jtreg.
RunTests.gmk:1117: *** Cannot continue.  Stop.
make[2]: *** [test-tier1] Error 2

ERROR: Build failed for target 'run-test-tier1' in configuration 'macosx-x86_64-server-release' (exit code 2)

No indication of failed target found.
Hint: Try searching the build log for '] Error'.
Hint: See doc/building.html#troubleshooting for assistance.

make[1]: *** [main] Error 2
make: *** [run-test-tier1] Error 2
```



参考链接：

https://github.com/openjdk/jdk/blob/master/doc/building.md

http://jdk.java.net/

https://adoptopenjdk.net/releases.html?variant=openjdk11&jvmVariant=hotspot

https://cloud.tencent.com/developer/article/1522903

https://ci.adoptopenjdk.net/view/Dependencies/job/jtreg/lastSuccessfulBuild/artifact/
