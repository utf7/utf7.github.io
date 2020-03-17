---
layout: post
title: Spring 事务的一个误区
description:  Spring 事务的一个误区
categories: Spring
keywords: Spring,Transactional
excerpt:  Spring,Transactional
---

Spring Bean 假设有如下类

```java
public class Service implement IService{

  @Transactional(readOnly = false, propagation=Propagation.REQUIRED)   
  public void methodA(){
     //.....


    methodB()

    //......
  }

  @Transactional(readOnly = false, propagation=Propagation.REQUIRES_NEW)   
  public void methodB{
    //......

  }


}
public class ServiceFacade{

  @Autowired
  private Iservice service;

  public void method(){
    //...
    service.methodA();
   //...
  }

}
```





1.问调用` ServiceFacade` 的 `method（）` 方法，请问  `methodA`  和  `methodB`   事务是怎么样的？

2.在同一个事务还是两个事务，`methodA` 事务生效还是 `methodB` 事务生效，还是都生效？

答案是` methodA` 的事务生效，`methodB` 被嵌入到 `methodA` 中变成一个事务。

为什么会这样呢？`methodB` 不是声明了 `Propagation.REQUIRES_NEW` 吗？


答案得从 `Spring` 的事务实现说起，`Spring` 的事务是通过 `AOP` 动态代理实现的。


为 `Bean` 生成代理。因为 `methodB` 在 `Service` 内部被调用，此时执行的并不是代理 `Bean` 的 `methodB`，所以`methodB` 上面的事务声明失效

`Facade` 调用 `Service` 的 `methodA` 方法的时候，实际上执行的是 `serviceProxy.methodA` ，所以 `method` 被`Spring`  事务接管,事务声明生效。




解决的办法是，`methodB` 放在另外的 `Bean`中被`methodA` 调用或者 `Facade` 调用 `service.methodA()` ,然后调用 `service.methodB`




总结：`Spring` 的事务是基于 `AOP` 动态代理实现的。默认情况下，在同一个类中调用不同的方法，上面的事务声明是无效的。
