function SuperArea(etype, draghtml) {
    this.eleType = etype;
    this.height = 0;

    this.element = this.create(draghtml);
    this.mask = this.element.children(".topic_areamask").first();
    this.heighthandle = this.element.children(".topic_heighthandle").first();
    this.heighthandleClip = {
        OldY: -1,
        Flag: false,
        FrameInfo: null, 
        FristDirect: 0  //0-未知，-1-高度调小，1-高度调大
    };
    this.AutoH();
    
    this.event();
};

SuperArea.prototype.create = function (draghtml) {
    var areadiv = document.createElement("div");
    var jqDiv = $(areadiv);

    jqDiv.attr({ "class": "topic_area" });

    var html = '';
    html += '<div class="topic_areamask"><ul><li><a href="javascript:;" btnv="dragarea"><i class="icon-move"></i></a></li><li>' + draghtml + '</li><li><a btnv="areaHeight">auto</a></li><li><a href="javascript:;" btnv="delete"><i class="icon-remove"></i></a></li></ul></div>';
    html += '<div class="topic_heighthandle"></div>';
    html += '<div class="topic_elementcont"></div>';
    jqDiv.html(html);

    var setting = jqDiv.find("a").eq(1);
    setting.removeAttr("rel");
    setting.attr("btnv", "setting");

    return jqDiv;
};

//创建容器后，填充内容
SuperArea.prototype.fill = function () {

};

SuperArea.prototype.outerHtml = function () {
    return this.element.prop("outerHTML");
};

SuperArea.prototype.appendTo = function (aimele) {
    aimele.append(this.element);
    this.AutoH();
};
SuperArea.prototype.afterTo = function (aimele) {
    aimele.after(this.element);
    this.AutoH();
};

SuperArea.prototype.getFrameInfoByDom = function () {
    var me = this, frameDom = me.element.parents("div[class*='topicedit_frame']");
    if (frameDom) {
        var areaPackets = frameDom.find(TopicEditor.Setting.AreaPacketSelector), curPacketIndex = this.element.parents(TopicEditor.Setting.AreaPacketSelector).index(), areaHeights = [];

        $.each(areaPackets, function (i, itemPacket) {
            if (i != curPacketIndex) {
                var temph = 0;
                //$.each($(itemPacket).children(".topic_area"), function (j, itemArea) {
                //    temph += $(itemArea).height();
                //    if (j > 0) temph += 10;
                //});
                //areaHeights[areaHeights.length] = temph;

                $.each($(itemPacket).children(".topic_area"), function (j, itemArea) {
                    if ($(itemArea).height() > TopicEditor.Setting.SuperAreaMinHeight && $.inArray($(itemArea).height(), areaHeights) == -1)
                        areaHeights[areaHeights.length] = $(itemArea).height();

                    temph += $(itemArea).height();
                    if (j > 0) temph += 10;
                    if (temph > TopicEditor.Setting.SuperAreaMinHeight && $.inArray(temph, areaHeights) == -1)
                        areaHeights[areaHeights.length] = temph;
                });
                
            }
        });

        return {
            curFrameIndex: frameDom.index(),
            colCount: areaPackets.length,
            curPacketIndex: curPacketIndex,
            curHeight: me.height, 
            areaHeights: areaHeights,
            curAreaIndex: me.element.index()
        };
    }
    else
        return {
            curFrameIndex: -1,
            colCount: 0,
            curPacketIndex: -1,
            curHeight: -1, 
            areaHeights: [],
            curAreaIndex: -1
        };
};

SuperArea.prototype.AutoH = function () {
    var me = this, viewH = me.mask.find("a[btnv='areaHeight']").eq(0);
    
    if (me.height <= TopicEditor.Setting.SuperAreaMinHeight) {
        me.element.children(".topic_elementcont").css("height", "");
        viewH.html("auto");
        viewH.removeAttr("style");
    } else {
        me.element.children(".topic_elementcont").eq(0).height(me.height);
        viewH.html(me.height + "px");
        viewH.css("color", "#c00");
    }
    me.mask.height(me.element.height());
    me.heighthandle.css("top", (me.mask.height() - me.heighthandle.outerHeight(true)) + "px");    
};

SuperArea.prototype.event = function () {
    var me = this, dom = TopicEditor.Dom;
    me.mask.find("li").select(function () { return false; });
    me.mask.bind({
        click: function (e) {
            e = e || event;
            var mouseEle = TopicEditor.Dom.Gt(e);
            if (mouseEle[0].tagName.toLowerCase() != "a") {
                mouseEle = mouseEle.parents("a");
            }
            
            if (mouseEle[0]) {
                if (mouseEle[0].tagName.toLowerCase() == "a") {
                    var btnv = mouseEle.attr("btnv");
                    if (btnv == "setting") {
                        //设置该区域的元素
                        alert("setting");
                    } else if (btnv == "delete") {
                        //删除区域
                        var curName = $.grep(TopicEditor.Setting.EleMenuData, function (n, i) { return n.rel == "element" && n.value == me.eleType; })[0].name;

                        var dd = dialog({
                            title: '确定删除' + curName + '区域',
                            content: '确定删除' + curName + '区域？删除后，该区域下的所有设置也将被一并删除。',
                            onshow: function () { me.mask.addClass("topicedit_mouseover"); },
                            width: 300,
                            okValue: '确定',
                            quickClose: true,
                            ok: function () {
                                TopicEditor.SuperPage.frameList[me.element.parents("div[class*='topicedit_frame']").index()].areaList[$.inArray((/[\S]+/ig).exec(me.element.parents(TopicEditor.Setting.AreaPacketSelector).attr("class")).toString(), ["topic_floatleft", "topic_floatright", "topic_center"])].splice(me.element.index(), 1);
                                me.element.remove();
                                me.mask.removeClass("topicedit_mouseover");
                            },
                            cancelValue: '取消',
                            cancel: function () {
                                me.mask.removeClass("topicedit_mouseover");
                            }
                        });
                        dd.show(mouseEle[0]);
                    }
                }
            }
            
            e.stopPropagation();
        },
        mousedown: function (e) {
            e = e || event;
            var mouseEle = TopicEditor.Dom.Gt(e);
            if (mouseEle[0].tagName.toLowerCase() == "i") {
                mouseEle = mouseEle.parent("a");
            }

            if (mouseEle[0].tagName.toLowerCase() == "a" && mouseEle.attr("btnv") == "dragarea") {
                //定义要移动区域的坐标
                var mouseAreaPacket = TopicEditor.SuperPage.selectAreaPacketByMouseover(e.clientX, e.clientY);
                var mouseArea = TopicEditor.SuperPage.selectAreaByMouseover(mouseAreaPacket.frameIndex, mouseAreaPacket.areaPacketIndex, e.clientX, e.clientY);
                //console.log(mouseArea.frameIndex + "｜" + mouseArea.areaPacketIndex + "｜" + mouseArea.areaIndex);
                TopicEditor.SuperPage.areaPosition = [mouseArea.frameIndex, mouseArea.areaPacketIndex, mouseArea.areaIndex];

                //区域拖拽事件
                dom.DragDiv = dom.CreateDragDiv(e, me);
                $("body").append($(dom.DragDiv));
                me.mask.addClass("topicedit_checked");
            }

            e.stopPropagation();
        }
    });

    var supermouse;
    me.heighthandle.bind({
        mousedown: function (e) {
            e = e || event;
            var mouseEle = TopicEditor.Dom.Gt(e);
            if (mouseEle[0].tagName.toLowerCase() == "div" && mouseEle.attr("class") == "topic_heighthandle") {
                me.heighthandleClip.Flag = true;
                me.heighthandleClip.OldY = e.clientY;
                me.heighthandleClip.FrameInfo = me.getFrameInfoByDom();
                me.heighthandle.addClass("topicedit_checked");
                
                supermouse = new MouseSpeed(e);
                me.height = me.element.height();
                me.AutoH();

            }

            e.stopPropagation();
        }
    });

    $("body").bind({
        mousemove: function (e) {
            e = e || event;
            if (me.heighthandleClip.Flag) {
                var grepHs = [], nowY = e.clientY; //console.log(supermouse.move(e).SpeedX + "｜" + supermouse.move(e).SpeedY);

                if (nowY < me.heighthandleClip.OldY) {
                    //高度调小时，筛选出小于当前区域高度的所有高度值
                    grepHs = $.grep(me.heighthandleClip.FrameInfo.areaHeights, function (n, i) { return n < me.heighthandleClip.FrameInfo.curHeight; });

                    if (me.heighthandleClip.FristDirect == 0)
                        me.heighthandleClip.FristDirect = -1;  //标记高度调节初始动作是调小
                    else {
                        if (me.heighthandleClip.FristDirect == 1 && $.inArray(me.heighthandleClip.FrameInfo.curHeight, grepHs) == -1) {
                            //表示初始动作是调小，其后的动作又调大了
                            grepHs[grepHs.length] = me.heighthandleClip.FrameInfo.curHeight;
                        }
                    }
                } else if (nowY > me.heighthandleClip.OldY) {
                    //高度调大时，筛选出大于当前区域高度的所有高度值
                    grepHs = $.grep(me.heighthandleClip.FrameInfo.areaHeights, function (n, i) { return n > me.heighthandleClip.FrameInfo.curHeight; });

                    if (me.heighthandleClip.FristDirect == 0)
                        me.heighthandleClip.FristDirect = 1;  //标记高度调节初始动作是调大
                    else {
                        if (me.heighthandleClip.FristDirect == -1 && $.inArray(me.heighthandleClip.FrameInfo.curHeight, grepHs) == -1) {
                            //表示初始动作是调大，其后的动作又调小了
                            grepHs[grepHs.length] = me.heighthandleClip.FrameInfo.curHeight;
                        }
                    }
                }

                //console.log(grepHs);

                me.height = me.height + (nowY - me.heighthandleClip.OldY); 
                if (me.heighthandleClip.FrameInfo.areaHeights.length > 0) {
                    grepHs = $.grep(grepHs, function (n, i) { return Math.abs(me.height - n) <= 5; });
                    if (grepHs.length > 0 && supermouse.move(e).SpeedY == 0) {
                        me.height = grepHs[0];
                    }
                }
                me.AutoH();

                //调整整个编辑界面的高度
                TopicEditor.Auto();

                me.heighthandleClip.OldY = nowY;
            }

            e.stopPropagation();
        },
        mouseup: function (e) {
            e = e || event;
            if (me.heighthandleClip.Flag) {
                if (supermouse) supermouse.end(e);
                supermouse = undefined;

                me.height = me.element.height();
                if (me.height <= TopicEditor.Setting.SuperAreaMinHeight)
                    me.height = TopicEditor.Setting.SuperAreaMinHeight;
                me.AutoH();

                if (me.heighthandleClip.FrameInfo.curFrameIndex > -1 && TopicEditor.SuperPage.frameList.length > 0) {
                    TopicEditor.SuperPage.frameList[me.heighthandleClip.FrameInfo.curFrameIndex].AutoH();
                }

                me.heighthandleClip.Flag = false;
                me.heighthandleClip.OldY = -1;
                me.heighthandleClip.FrameInfo = null;
                me.heighthandleClip.FristDirect = 0;
                me.heighthandle.removeClass("topicedit_checked");

                
            }
        }
    });
};



//-----------------------以下为 MouseSpeed 的代码 --------------------------------------//

function MouseSpeed(event) {
    this.num = 100;
    this.beginX = event.clientX;
    this.beginY = event.clientY;
    this.curX = this.beginX;
    this.curY = this.beginY;
    this.timeX = 0;
    this.timeY = 0

    var me = this;
    var x = me.beginX, y = me.beginY;
    this.timeInterval = setInterval(function () {
        if (Math.abs(me.curX - x) > 10)
            me.timeX += 200;
        else
            me.timeX = 0;
        if (Math.abs(me.curY - y) > 10)
            me.timeY += 200;
        else
            me.timeY = 0;

        x = me.curX;
        y = me.curY;
    }, 200);
};

MouseSpeed.prototype.move = function (event) {
    var me = this;
    me.curX = event.clientX;
    me.curY = event.clientY;

    return {
        SpeedX: me.timeX == 0 ? 0 : Math.round(Math.abs(me.curX - me.beginX) / me.timeX * me.num),
        SpeedY: me.timeY == 0 ? 0 : Math.round(Math.abs(me.curY - me.beginY) / me.timeY * me.num)
    };
};

MouseSpeed.prototype.end = function (event) {
    var me = this;
    me.curX = event.clientX;
    me.curY = event.clientY;
    clearInterval(me.timeInterval);

    return {
        SpeedX: me.timeX == 0 ? 0 : Math.round(Math.abs(me.curX - me.beginX) / me.timeX * me.num),
        SpeedY: me.timeY == 0 ? 0 : Math.round(Math.abs(me.curY - me.beginY) / me.timeY * me.num)
    };
};
