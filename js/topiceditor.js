var TopicEditor = new Object();

//定义一些配置信息
TopicEditor.Setting = {
    EleMenuData: [ //左侧菜单数据
        { "rel": "frame", "name": "通栏框架", "value": 1, "iconClass": "icon-reorder" },
        { "rel": "frame", "name": "双列框架", "value": 2, "iconClass": "icon-th-large" },
        { "rel": "frame", "name": "三列框架", "value": 3, "iconClass": "icon-th" },
        { "rel": "element", "name": "Banner", "value": 0, "iconClass": "icon-magnet" },
        { "rel": "element", "name": "专题导语", "value": 1, "iconClass": "icon-info-sign" },
        { "rel": "element", "name": "专题导航", "value": 2, "iconClass": "icon-tasks" },
        { "rel": "element", "name": "图文列表", "value": 3, "iconClass": "icon-list" },
        { "rel": "element", "name": "时间轴", "value": 4, "iconClass": "icon-time" },
        { "rel": "element", "name": "图片元素", "value": 5, "iconClass": "icon-picture" },
        { "rel": "element", "name": "自由文字", "value": 6, "iconClass": "icon-file-alt" },
        { "rel": "element", "name": "头条列表", "value": 7, "iconClass": "icon-credit-card" },
        { "rel": "element", "name": "表格文字", "value": 8, "iconClass": "icon-table" },
        { "rel": "element", "name": "行情列表", "value": 9, "iconClass": "icon-list-ol" },
        { "rel": "element", "name": "H5行情图", "value": 10, "iconClass": "icon-bar-chart" }
    ],
    EleMenuInterval: null,
    EleMenuCssTop: 19,
    SuperAreaMinHeight: 30, 
    IdPrefix: "topicedit_",   //需要绑定事件的节点ID前缀
    DragDivModel: function () {  //左侧菜单项转换成拖拽层的必备属性
        this.srcele = null;
        this.currentX = 0;
        this.currentY = 0;
        this.left = 0;
        this.top = 0;
        this.dragType = "frame";
        this.dragVal = -1;
        this.targetFrameIndex = -2;
        this.targetAreaPacketIndex = -1;
        this.targetAreaIndex = -1;
    },
    AnimateTime: 500,  //TopicEditor对象中所有动画时间
    Extend: function (extension, obj) {
        for (var key in extension) {
            obj[key] = extension[key];
        }
    },
    AreaPacketSelector: "div[class^='topic_floatleft'], div[class^='topic_floatright'], div[class^='topic_center']"
};

//对外开放的API方法，所有对外方法必须在这里添加
TopicEditor.Api = {
    LoadEndCallback: function () {
        //TopicEditor对象加载结束事件回调
    },
    EleMenu: {
        //元素工具栏拖拽事件开始前（mousedown事件），对外开放的回调方法
        DragBefore: function (e, dtype, dval, dtext) {
            /*
                e —— 鼠标事件变量
                dtype —— 在工具栏上选择的元素类型
                dval —— 在工具栏上选择的的value
                dtext —— 在工具栏上选择的元素名称
            */
        },
        //元素工具栏拖拽事件结束后，对外开放的回调方法
        DragEnd: function (e, dtype, dval, dtext, frameindex, apindex) {
            /*
                e —— 鼠标事件变量
                dtype —— 在工具栏上选择的元素类型
                dval —— 在工具栏上选择的的value
                dtext —— 在工具栏上选择的元素名称
                frameindex —— 目标框架所在同级框架集合中的索引值，当第一次添加框架时，该值 等于-1
                apindex —— 在目标区块所在区块集合的索引值 0-左 1-右 2-中，当dtype=="frame"时，该值等于-1
            */
        }
    },
    EditForm: {
        Open: function (url) {
            var dom = TopicEditor.Dom;
            var handle = dom.EditForm.children(".handle").first();
            if (dom.EditForm.width() == handle.width()) //当表单区是收起状态
                TopicEditor.Dom.OpenEditForm(url);
        },
        Close: function () {
            TopicEditor.Dom.CloseEditForm();
        }
    }
};

//框架、区域集合
TopicEditor.SuperPage = new SuperPage();

//定义用于保存需要绑定事件的节点的集合变量，以及动态创建节点的一些方法
TopicEditor.Dom = {
    DragDiv: null,  //全局元素拖拽层
    Gt: function (e) {  //获取鼠标位置所在的节点
        e = e || event;
        return $(e.target || e.srcElement);
    },
    OpenEditForm: function (url) {
        var dom = TopicEditor.Dom;
        var handle = dom.EditForm.children(".handle").first(), ifarea = dom.EditForm.children(".formarea").first();
        var openW = parseInt(($(window).width() - dom.EleMenu.width() - (dom.EditArea.innerWidth() - dom.EditArea[0].scrollWidth)) / 3 + 100);
        var regUrl = /^http:\/\//gi;
        if (regUrl.test(url))
            dom.IframeMain.attr("src", url + (url.indexOf("?") > -1 ? "&" : "?") + "rt=" + parseInt(Math.random() * 100000000000));
        dom.EditForm.animate({
            width: openW + "px"
        }, TopicEditor.Setting.AnimateTime, function () {
            dom.EditForm.removeClass("topicedit_editfromclose");
            ifarea.width(openW - handle.width());
            ifarea.height(dom.EditForm.height());
        });
    },
    CloseEditForm: function () {
        TopicEditor.Dom.EditForm.addClass("topicedit_editfromclose");
        TopicEditor.Dom.EditForm.animate({
            width: "20px"
        }, TopicEditor.Setting.AnimateTime);
    },
    IsMouseOver: function (nowX, nowY, aimEle) {
        return nowX > aimEle.offset().left && nowX < (aimEle.offset().left + aimEle.width()) && nowY > aimEle.offset().top && nowY < (aimEle.offset().top + aimEle.height());
    },
    /*
        ——修改框架比例的方法——
        有3种使用方法：
        1、什么参数都不传，表示修改me.SuperPage.frameList中所有框架的比例；
        2、只传一个参数，且传递的参数为数值型，表示根据SuperPage的列比例，由me.SuperPage.frameList的索引值修改指定框架的比例；
        3、传递二个参数，表示根据传入的propV参数，由me.SuperPage.frameList的索引值修改指定框架的比例
    */
    ModFrameProp: function (index, propV) {  //index——SuperPage对象的frameList属性（页面中框架集合）的索引值（me.SuperPage.frameList[index]） propV——要设置的比例（该参数只有在index传入后，才有效）
        var me = TopicEditor;

        if (arguments.length == 0) { //什么参数都不传，表示修改me.SuperPage.frameList中所有框架的比例
            $.each(me.SuperPage.frameList, function (i, itemFrame) {
                itemFrame.modProp(me.SuperPage.colProp);
            });
        } else if (arguments.length == 1 && typeof (arguments[0]) == "number") { //只传一个参数，且传递的参数为数值型，表示根据SuperPage的列比例，由me.SuperPage.frameList的索引值修改指定框架的比例
            me.SuperPage.frameList[index].modProp(me.SuperPage.colProp);
        } else if (arguments.length == 2) { //传递二个参数，表示根据传入的propV参数，由me.SuperPage.frameList的索引值修改指定框架的比例
            me.SuperPage.frameList[index].modProp(propV);
        }
    }
};
//创建拖拽层的方法
TopicEditor.Dom.CreateDragDiv = function (e, srcEle) {
    var dd = document.createElement("div");
    dd.setAttribute("class", "topicedit_dragele");
    TopicEditor.Setting.Extend(new TopicEditor.Setting.DragDivModel(), dd);
    //防止文字选中
    dd.onselectstart = function () {
        return false;
    };

    dd.srcele = srcEle;
    dd.currentX = e.clientX;
    dd.currentY = e.clientY; 
    if (typeof (dd.srcele.eleType) == "number") { //表示拖拽的是现有的SuperArea
        dd.left = srcEle.element.offset().left;
        dd.top = srcEle.element.offset().top;
    } else { //表示拖拽的是左侧工具栏
        dd.left = $(srcEle).offset().left;
        dd.top = $(srcEle).offset().top;
    }
    dd.style.left = dd.left + "px";
    dd.style.top = dd.top + "px";

    if (typeof (dd.srcele.eleType) == "number") { //表示拖拽的是现有的SuperArea
        dd.dragType = "element_exist";
        dd.dragVal = parseInt(srcEle.element.find("div[class^='topic_areamask'] li").eq(1).attr("val"));

        dd.innerHTML = srcEle.element.find("div[class^='topic_areamask'] li").eq(1).html();
    } else { //表示拖拽的是左侧工具栏
        var rel = $(srcEle).children("a").eq(0).attr("rel");
        dd.dragType = $(srcEle).children("a").first().attr("rel");
        dd.dragVal = parseInt($(srcEle).children("a").first().attr("val"));

        dd.innerHTML = srcEle.innerHTML;
        srcEle.innerHTML = "";
    }
    
    return dd;
};

//TopicEditor对象初始化方法，一般放在$(document).ready()事件里
TopicEditor.Init = function () {
    var me = TopicEditor;

    //定义需要绑定事件的节点
    me.Dom.TopArea = $("#" + TopicEditor.Setting.IdPrefix + "toparea");
    me.Dom.EleMenu = $("#" + TopicEditor.Setting.IdPrefix + "elemenu");
    me.Dom.EditArea = $("#" + TopicEditor.Setting.IdPrefix + "editarea");
    me.Dom.EditForm = $("#" + TopicEditor.Setting.IdPrefix + "editform");
    me.Dom.IframeMain = $("#" + TopicEditor.Setting.IdPrefix + "frameMain");
    me.Dom.PageWidthSelect = $("#" + TopicEditor.Setting.IdPrefix + "pageWidthSelect");
    me.Dom.PageColumnPropSelect = $("#" + TopicEditor.Setting.IdPrefix + "columnPropSelect");

    //给左侧菜单添加菜单内容
    var relv = 'frame', menuHtml = '';
    $.each(me.Setting.EleMenuData, function (i, itemEMD) {
        if (itemEMD.rel != relv)
            menuHtml += '<li class="elemenugap"></li>';
        relv = itemEMD.rel;

        menuHtml += '<li><a href="javascript:;" val="' + itemEMD.value + '" rel="' + itemEMD.rel + '" title="' + itemEMD.name + '"><i class="' + itemEMD.iconClass + '"></i><span>' + itemEMD.name + '</span></a></li>';
    });
    me.Dom.EleMenu.children("ul").eq(0).html(menuHtml);
    me.Setting.EleMenuCssTop = parseInt(me.Dom.EleMenu.children("ul").eq(0).css("top").replace(/px/gi, ''));

    me.SuperPage.width = parseInt(me.Dom.PageWidthSelect.val());
    me.SuperPage.colProp = me.SuperPage.convertPropArray(me.Dom.PageColumnPropSelect.val());

    me.Auto(me.SuperPage.getFramesHeight());
    me.Event.All();

    if (typeof (me.Api.LoadEndCallback) == "function")
        me.Api.LoadEndCallback();
};

//编辑页面自适应浏览器窗口高度和宽度的方法，一般写在页面的onresize事件,以及添加框架和手动调整区域高度动作完成之后
TopicEditor.Auto = function (framesHeight) {
    var dom = TopicEditor.Dom, framesHeight = framesHeight == undefined ? TopicEditor.SuperPage.getFramesHeight() : framesHeight;

    var curH = $(window).height() - dom.TopArea.outerHeight(), settingH = curH, extendH = 200;
    if (framesHeight > 0) {
        if (framesHeight > settingH) {
            settingH = framesHeight + extendH;
        } else {
            if (settingH - framesHeight < extendH)
                settingH += extendH;
        }
    }
    
    //设置编辑区高度
    dom.EditArea.height(settingH);
    if (dom.EditArea.outerHeight() > settingH) {
        dom.EditArea.height(settingH - (dom.EditArea.outerHeight() - settingH));
    }

    //设置左侧元素工具栏高度
    dom.EleMenu.height(curH);
    var elemenu_movedown = dom.EleMenu.children("div[class^='elemenu_movedown']").eq(0);
    elemenu_movedown.css("top", (curH - elemenu_movedown.height()) + "px")

    //设置右侧表单区的高度
    var handle = dom.EditForm.children(".handle").first(), ifarea = dom.EditForm.children(".formarea").first();
    handle.css({ "height": curH + "px", "line-height": curH + "px" });

    //设置右侧表单区距离窗口顶部的距离
    dom.EditForm.css({ "top": ($(window).scrollTop() + dom.TopArea.outerHeight()) + "px" });
    if (dom.EditArea[0].scrollHeight - dom.EditArea.height() > TopicEditor.Setting.SuperAreaMinHeight) { //表示有滚动条时，右侧表单区距离窗口右侧的距离应在编辑区滚动条之外（不应该遮盖住编辑区的滚动条）
        dom.EditForm.css({ "right": (dom.EditArea.innerWidth() - dom.EditArea[0].scrollWidth) + "px" });
        dom.TopArea.width($(window).width() - dom.EditArea[0].scrollWidth);
    } else {
        dom.EditForm.css({ "right": "0px" });
        dom.TopArea.width($(window).width());
    }

    //当右侧表单区状态为展开时，设置其宽度
    if (dom.EditForm.width() > handle.width()) { //当表单区是展开状态
        var openW = parseInt(($(window).width() - dom.EleMenu.width() - (dom.EditArea.innerWidth() - dom.EditArea[0].scrollWidth)) / 3 + 100);
        dom.EditForm.width(openW);
        handle.css({ "height": settingH + "px", "line-height": settingH + "px" });
        ifarea.width(openW - handle.width());
        ifarea.height(handle.height());
    }
};

//编辑页面事件相关
TopicEditor.Event = (function () {
    var me = TopicEditor;
    var dom = me.Dom;
    var api = me.Api;

    return {
        All: function () {
            this.PageWidthSelect();
            this.PagePropSelect();
            this.EditFormHandle();
            this.EleMenuDrag();

        },
        PageWidthSelect: function () {
            dom.PageWidthSelect.change(function () {
                me.SuperPage.width = parseInt($(this).val());
                if (me.SuperPage.frameList.length > 0) {
                    $.each(me.SuperPage.frameList, function (i, itemFrame) {
                        itemFrame.element.children("div[class^='topic_']").removeClass("topic_w1000");
                        itemFrame.element.children("div[class^='topic_']").removeClass("topic_w1200");
                        if (me.SuperPage.width == 1200)
                            itemFrame.element.children("div[class='']").addClass("topic_w1200");
                        else
                            itemFrame.element.children("div[class='']").addClass("topic_w1000");
                    });
                }
            });
        },
        PagePropSelect: function () {
            dom.PageColumnPropSelect.change(function () {
                me.SuperPage.colProp = me.SuperPage.convertPropArray($(this).val());
                if (me.SuperPage.frameList.length > 0)
                    //因页面列间比例变化，需整理已存在的框架比例模型和文档结构
                    dom.ModFrameProp();
            });
        },
        //右侧表单展开/关闭事件
        EditFormHandle: function () {
            var handle = dom.EditForm.children(".handle").first(), ifarea = dom.EditForm.children(".formarea").first();
            handle.click(function () {
                if (dom.EditForm.width() == handle.width()) //当表单区是收起状态
                    dom.OpenEditForm();
                else 
                    dom.CloseEditForm();
            });
        },
        //左侧元素工具栏拖拽事件
        EleMenuDrag: function () {
            dom.EleMenu.mousedown(function (e) {
                e = e || event;
                var srcEle = dom.Gt(e);

                if (srcEle[0].tagName.toLowerCase() == "div") {
                    var moveUl = dom.EleMenu.children("ul").eq(0);
                    if (moveUl.height() > (dom.EleMenu.height() - srcEle.outerHeight() * 2)) {
                        var moveSpeed = parseInt(moveUl.height() / moveUl.children("li").length);
                        if (srcEle.attr("class").indexOf("elemenu_moveup") > -1 || srcEle.attr("class").indexOf("elemenu_movedown") > -1) {
                            me.Setting.EleMenuInterval = setInterval(function () {
                                var curTop = moveUl.offset().top - dom.TopArea.outerHeight(), upmax = dom.EleMenu.height() - srcEle.outerHeight() - moveUl.height() + 1;
                                if (srcEle.attr("class").indexOf("elemenu_moveup") > -1) {
                                    curTop -= moveSpeed;
                                    if (curTop < upmax) curTop = upmax;
                                } else if (srcEle.attr("class").indexOf("elemenu_movedown") > -1) {
                                    curTop += moveSpeed;
                                }

                                //console.log(curTop +"|"+ me.Setting.EleMenuCssTop);
                                if (curTop >= me.Setting.EleMenuCssTop)
                                    moveUl.css("top", "");
                                else
                                    moveUl.css("top", curTop + "px");
                            }, 100);
                        }
                    }
                    
                } else {
                    if (srcEle[0].tagName.toLowerCase() != "li")
                        srcEle = srcEle.parents("li");

                    if (srcEle[0] && srcEle[0].tagName.toLowerCase() == "li") {
                        dom.DragDiv = dom.CreateDragDiv(e, srcEle[0]);
                        $("body").append($(dom.DragDiv));

                        if (typeof (api.EleMenu.DragBefore) == "function")
                            api.EleMenu.DragBefore(e, dom.DragDiv.dragType, dom.DragDiv.dragVal, $(dom.DragDiv).find("span").first().text());
                    }
                }
            });
            dom.EleMenu.mouseup(function (e) {
                clearInterval(me.Setting.EleMenuInterval);
            });

            $("body").bind({
                mousemove: function (e) {
                    e = e || event;
                    if (dom.DragDiv) {
                        var nowX = e.clientX, nowY = e.clientY, scrollTop = $(window).scrollTop();
                        var disX = nowX - dom.DragDiv.currentX, disY = nowY - dom.DragDiv.currentY;
                        dom.DragDiv.style.left = dom.DragDiv.left + disX + "px";
                        dom.DragDiv.style.top = dom.DragDiv.top + disY + "px";

                        if (dom.DragDiv.dragType == "frame") { //拖拽框架
                            if (me.SuperPage.frameList.length == 0) { //当框架集合为空时，编辑区域经过时为选中状态
                                if (dom.IsMouseOver(nowX, nowY + scrollTop, dom.EditArea)) {
                                    if (!dom.EditArea.hasClass("topicedit_mouseover")) {
                                        dom.EditArea.addClass("topicedit_mouseover");
                                        dom.DragDiv.targetFrameIndex = -1; //表示将框架拖拽到编辑区中
                                    }
                                }
                                else {
                                    dom.EditArea.removeClass("topicedit_mouseover");
                                    dom.DragDiv.targetFrameIndex = -2; //表示将框架拖拽到相应区域之外
                                }
                            }
                            else { //当框架集合有值时，编辑区中相应的框架经过时为选中状态
                                var mouseFrame = me.SuperPage.selectFrameByMouseover(nowX, nowY + scrollTop).FrameObj;
                                if (mouseFrame) {
                                    if (dom.IsMouseOver(nowX, nowY + scrollTop, mouseFrame.element)) {
                                        if (!mouseFrame.element.hasClass("topicedit_mouseover")) {
                                            mouseFrame.element.addClass("topicedit_mouseover");
                                            dom.DragDiv.targetFrameIndex = mouseFrame.element.index(); //表示将框架拖拽到其它框架之后
                                        }
                                    }
                                    else {
                                        mouseFrame.element.removeClass("topicedit_mouseover");
                                        dom.DragDiv.targetFrameIndex = -2; //表示将框架拖拽到相应框架之外
                                    }
                                } else {
                                    dom.EditArea.children(".topicedit_frame").removeClass("topicedit_mouseover");
                                    dom.DragDiv.targetFrameIndex = -2; //表示将框架拖拽到相应框架之外
                                }
                            }

                        } else if (dom.DragDiv.dragType == "element" || dom.DragDiv.dragType == "element_exist") { //拖拽区域（新增或已存在）
                            if (me.SuperPage.frameList.length > 0) { //当编辑区中有框架时，拖拽行为才起作用
                                var mouseAreaPacket = me.SuperPage.selectAreaPacketByMouseover(nowX, nowY + scrollTop);
                                if (mouseAreaPacket.frameIndex > -1 && mouseAreaPacket.areaPacketIndex > -1) {
                                    mouseAreaPacket.FrameObj.element.addClass("topicedit_mouseover");
                                    mouseAreaPacket.AreaPagetObj.addClass("topicedit_mouseover");

                                    dom.DragDiv.targetFrameIndex = mouseAreaPacket.frameIndex;
                                    dom.DragDiv.targetAreaPacketIndex = mouseAreaPacket.areaPacketIndex;

                                    if (mouseAreaPacket.FrameObj.areaList[mouseAreaPacket.areaPacketIndex].length > 0) {
                                        var mouseArea = me.SuperPage.selectAreaByMouseover(mouseAreaPacket.frameIndex, mouseAreaPacket.areaPacketIndex, nowX, nowY + scrollTop);
                                        if (mouseArea.areaIndex > -1) {
                                            dom.DragDiv.targetAreaIndex = mouseArea.areaIndex;
                                            mouseArea.AreaObj.mask.addClass("topicedit_mouseover");

                                        } else {
                                            dom.DragDiv.targetAreaIndex = -1;
                                            //console.log(mouseArea);
                                            //mouseArea.AreaObj.mask.removeClass("topicedit_mouseover");
                                            dom.EditArea.find("div[class*='topic_areamask']").removeClass("topicedit_mouseover");
                                        }
                                    }
                                    
                                } else {
                                    dom.EditArea.find("div[class*='topicedit_frame'], div[class*='topic_areamask'], " + TopicEditor.Setting.AreaPacketSelector).removeClass("topicedit_mouseover");
                                    dom.DragDiv.targetFrameIndex = -2;
                                    dom.DragDiv.targetAreaPacketIndex = -1;
                                    dom.DragDiv.targetAreaIndex = -1;
                                }
                            }
                        }

                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;
                        }
                        return false;
                    }
                },
                mouseup: function (e) {
                    e = e || event;
                    if (dom.DragDiv) {
                        var nowX = e.clientX, nowY = e.clientY, scrollTop = $(window).scrollTop();
                        dom.DragDiv.srcele.innerHTML = dom.DragDiv.innerHTML;
                        if (dom.DragDiv.dragType == "frame") { //拖拽框架
                            if (me.SuperPage.frameList.length == 0) {
                                if (dom.IsMouseOver(nowX, nowY + scrollTop, dom.EditArea)) {
                                    var sfObj = new SuperFrame(dom.DragDiv.dragVal, me.SuperPage.width, me.SuperPage.colProp);
                                    me.SuperPage.frameList[me.SuperPage.frameList.length] = sfObj;
                                    sfObj.appendTo(dom.EditArea);
                                    dom.EditArea.removeClass("topicedit_mouseover");
                                }
                            } else {
                                var mouseFrame = me.SuperPage.selectFrameByMouseover(nowX, nowY + scrollTop);
                                if (mouseFrame.FrameObj) {
                                    var sfObj = new SuperFrame(dom.DragDiv.dragVal, me.SuperPage.width, me.SuperPage.colProp);
                                    if (mouseFrame.indexNum == me.SuperPage.frameList.length - 1) {
                                        me.SuperPage.frameList[me.SuperPage.frameList.length] = sfObj;
                                        sfObj.appendTo(dom.EditArea);
                                    } else {
                                        me.SuperPage.frameList.splice(mouseFrame.indexNum + 1, 0, sfObj);
                                        sfObj.afterTo(mouseFrame.FrameObj.element);
                                    }
                                    mouseFrame.FrameObj.element.removeClass("topicedit_mouseover");
                                    
                                }
                            }
                            
                        } else if (dom.DragDiv.dragType == "element" || dom.DragDiv.dragType == "element_exist") { //拖拽区域（新增）
                            if (me.SuperPage.frameList.length > 0) {
                                var mouseAreaPacket = me.SuperPage.selectAreaPacketByMouseover(nowX, nowY + scrollTop);
                                if (mouseAreaPacket.frameIndex > -1 && mouseAreaPacket.areaPacketIndex > -1) {
                                    var mouseArea = me.SuperPage.selectAreaByMouseover(mouseAreaPacket.frameIndex, mouseAreaPacket.areaPacketIndex, nowX, nowY + scrollTop);

                                    if (dom.DragDiv.dragType == "element") {
                                        var superArea = new SuperArea(parseInt($(dom.DragDiv).children("a").attr("val")), $(dom.DragDiv).html());
                                        if (mouseArea.AreaObj) { //表示添加在鼠标所在区域后面（after）
                                            mouseAreaPacket.FrameObj.afterArea(mouseAreaPacket.areaPacketIndex, mouseArea.areaIndex, superArea);
                                        } else { //表示添加在鼠标所在区块内部（append）
                                            mouseAreaPacket.FrameObj.appendArea(mouseAreaPacket.areaPacketIndex, superArea);
                                        }
                                    } else if (dom.DragDiv.dragType == "element_exist") {
                                        if (mouseArea.AreaObj) { //表示添加在鼠标所在区域后面（after）
                                            if (mouseArea.AreaObj.mask.attr("class").indexOf("topicedit_checked") == -1)  //表示鼠标所在区域非之前选中的区域
                                                mouseAreaPacket.FrameObj.afterArea(mouseAreaPacket.areaPacketIndex, mouseArea.areaIndex, dom.DragDiv.srcele);
                                        } else { //表示添加在鼠标所在区块内部（append）
                                            mouseAreaPacket.FrameObj.appendArea(mouseAreaPacket.areaPacketIndex, dom.DragDiv.srcele);
                                        }
                                        //移动后，从原区域所在的数据中删除原区域
                                        if (me.SuperPage.frameList.length > me.SuperPage.areaPosition[0] && me.SuperPage.frameList[me.SuperPage.areaPosition[0]].areaList.length > me.SuperPage.areaPosition[1] && me.SuperPage.frameList[me.SuperPage.areaPosition[0]].areaList[me.SuperPage.areaPosition[1]].length > me.SuperPage.areaPosition[2]) {
                                            if (mouseArea.AreaObj) {
                                                if (mouseArea.AreaObj.mask.attr("class").indexOf("topicedit_checked") == -1)  //表示鼠标所在区域非之前选中的区域
                                                    me.SuperPage.frameList[me.SuperPage.areaPosition[0]].areaList[me.SuperPage.areaPosition[1]].splice(me.SuperPage.areaPosition[2], 1);
                                            } else {
                                                me.SuperPage.frameList[me.SuperPage.areaPosition[0]].areaList[me.SuperPage.areaPosition[1]].splice(me.SuperPage.areaPosition[2], 1);
                                            }
                                            
                                            //还原移动区域的坐标值为默认值
                                            me.SuperPage.areaPosition = [-1, -1, -1];
                                        }
                                    }
                                    
                                }

                                dom.EditArea.find("div[class*='topicedit_frame'], div[class*='topic_areamask'], " + TopicEditor.Setting.AreaPacketSelector).removeClass("topicedit_mouseover");

                                if (dom.DragDiv.dragType == "element_exist")
                                    dom.EditArea.find("div[class*='topic_areamask']").removeClass("topicedit_checked");

                                console.log(me.SuperPage);
                            }
                        }

                        //调整整个编辑界面的高度
                        me.Auto(me.SuperPage.getFramesHeight());

                        if (typeof (api.EleMenu.DragEnd) == "function")
                            api.EleMenu.DragEnd(e, dom.DragDiv.dragType, dom.DragDiv.dragVal, $(dom.DragDiv).find("span").text(), dom.DragDiv.targetFrameIndex, dom.DragDiv.targetAreaPacketIndex);

                        $(dom.DragDiv).remove();
                        dom.DragDiv = null;
                    }
                }
            });

            $(window).scroll(function () {
                var scrollTop = $(window).scrollTop(), topH = dom.TopArea.outerHeight();
                dom.TopArea.css("top", scrollTop + "px");
                dom.EditForm.css("top", (scrollTop + topH) + "px");
                dom.EleMenu.css("top", scrollTop + "px");
            });
        }
    };
})();