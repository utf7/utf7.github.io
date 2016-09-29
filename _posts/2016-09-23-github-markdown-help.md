---
layout: post
title: Github Markdown 写作帮助
description: Github Markdown 写作帮助
categories: Markdown
keywords: github，markdown,writing,notes
excerpt: Github Markdown 写作帮助
---

## Github Markdown写作帮助

Github Markdown 语法又称 GFM 

### 标题

使用不同数目的 `#` 来表示不同级别的标题

```        
# 一级标题        
## 二级标题        
### 三级标题         
```

# 一级标题  
## 二级标题  
### 三级标题  

### 链接
可以使用`[]()`来实现链接功能  
该博客建立在 `[Github Pages](https://pages.github.com/)`  
该博客建立在 [Github Pages](https://pages.github.com/)


### 文本格式

粗体，斜体，删除线

![](/images/posts/github/github-markwon-help/gfm_help.png)

### 插入代码
可以使用\`\`

\`\`\`  
public void test(){   
	System.out.println("Syntax highlighting");  
}  
\`\`\`

```
public void test(){
	System.out.println("Syntax highlighting");
}
```


### 代码高亮
\`\`\`java  
public void test(){  
	System.out.println("Syntax highlighting");  
}  
\`\`\`

```java
public void test(){
	System.out.println("Syntax highlighting");
}
```



### 列表

可以使用 `-` 或 `*` 来实现列表功能

\- Java  
\- Scala  
\- Markdown  

- Java  
- Scala  
- Markdown  

有序列表

1. Java  
2. Scala  
3. Markdown  

1. Java  
2. Scala  
3. Markdown  

嵌套列表

可以在行与行之间使用两个空格实现

```

1. Make my changes  

  1. Fix bug  
  
  2. Improve formatting  
  
    * Make the headings bigger  
	
2. Push my commits to GitHub  

3. Open a pull request  

  * Describe my changes  
  
  * Mention all the members of my team  
  
    * Ask for feedback  
	
```	

1. Make my changes  
  1. Fix bug  
  2. Improve formatting  
    * Make the headings bigger  
2. Push my commits to GitHub  
3. Open a pull request  
  * Describe my changes  
  * Mention all the members of my team  
    * Ask for feedback  	 

### 任务列表
Github 支持任务列表 `[]`， 使用 `[x]` 表示任务完成

\- \[x\] Finish my changes  
\- \[ \] Push my commits to GitHub  
\- \[ \] Open a pull request  

- [x] Finish my changes  
- [ ] Push my commits to GitHub  
- [ ] Open a pull request  
	



### 忽略 Markdown 格式
可以使用`\` 忽略 Markdown 的格式

`Let's rename \*our-new-project\* to \*our-old-project\*.`

Let's rename \*our-new-project\* to \*our-old-project\*.

### emoji 表情

支持 emji 表情,支持 @ 某个 github 用户或者组织
用法 `:EMOJICODE:`,`@user`

`@utf7 :+1: This PR looks great-it's ready to merge!:shipit:`  
@utf7 :+1: This PR looks great-it's ready to merge!:shipit:



		 
参考：

[Basic Writing and formatting syntax](https://help.github.com/articles/basic-writing-and-formatting-syntax/)  
[Autolinked references and URLs](https://help.github.com/articles/autolinked-references-and-urls/)  
[Working with advanced formatting](https://help.github.com/articles/working-with-advanced-formatting/)  