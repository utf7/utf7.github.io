---
layout: post
title: 一次 java/scala 整型溢出的问题
description: 一次 java/scala 整型溢出的问题
categories: [Java]
keywords: Java,整型溢出
excerpt: Java,scala
---

#  一次 Java/Scala 整型溢出的问题

刚到新公司，为了测试一下内部的 `git` 权限，就随便修改了一点代码，提交一下，看是否可以正常提交代码。

本来想修改的都是没有什么影响的代码，结果第一次提交代码就出现了问题。。。

记录一下，引以为戒。

原来的代码是这样的：

```java
private val readLimit = 21990232555520L
```

修改后为：

```java
private val readLimit = 20 * 1024 * 1024 * 1024 * 1024L
```

表示读限制为 20TB 

谁知道竟然出现了问题,你们猜是什么问题？？？



～我是分隔符～

***

---

---

___

***

***



可能有些人已经发现了，发生了整型溢出导致readLimit 为负数，险些踉成大错。。。

```java
20 * 1024 * 1024 *1024 = 21474836480
//Java 中int 最大值为：Integer.MAX_VALUE = 2147483647
```

显然  20 * 1024 * 1024 *1024 > Integer.MAX_VALUE，最终导致整型溢出。

说实话这个错误发生的对我来说并不是偶然，如果这次不出现，可能以后我还是会犯类似的，这里面有一个思维定势。

虽然整型溢出和范围我一直都是有概念的，比如写类似如下代码的时候，我会非常小心和注意。

```java
int readLimit = 20*1024*1024*1024;//错误，溢出
```

但是假如写如下代码：

```java
long readLimit = 20 * 1024 * 1024 * 1024 * 1024L
```

说实话我就没有想到这块会整型溢出，误以为会自动类型推导的，因为后面特意写了 ```*1024L``` 来表示这个一个` long `类型。

这块也是我的一个思维定势，比如 `HBase` [源代码](https://github.com/apache/hbase/blob/rel/2.3.1/hbase-common/src/main/java/org/apache/hadoop/hbase/HConstants.java#L420) 中，默认的 ```Region Size``` 最大值的代码 :

```java
public static final long DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024L;
```

当然如上代码是没有问题的，因为 ```10*1024*1024``` 并没有超过整型的最大值，但是这种写法是不值得推荐的。

其实这个问题，细想想的话，Java 操作符优先级的话，应该是可以发现的，但还是发生了一个思维定势想当然的低级错误。

最后推荐一下比较好的写法是

 ```java
long readLimit = 20L * 1024L * 1024L * 1024L * 1024L
或者
long readLimit = 20L * 1024 * 1024 * 1024 * 1024
 ```

也就是先把 `long `类型放在前面即可。

非常不推荐如下写法

```
long readLimit = x*y*z*1024L
```

即使当时不发生溢出，也有可能因为参数，或者调整了xyz的大小导致溢出
