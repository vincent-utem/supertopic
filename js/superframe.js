//框架类
function SuperFrame(count, width, prop) {

    this.colCount = count;
    this.colProp;  //比例数组：三列new Array(左, 中, 右)，二列new Array(左, 右)
    this.setColProp(prop);
    //该框架下的区域集合（二维数组），分别为[[左集合]，[右集合]，[中集合]]
    this.areaList = [[], [], []];

    this.propHandleFlag = false; //手动调节比例的开关，当为true时，才能手动调节框架比例
    this.curPropHandle = { //当前正在使用的调节比例手柄，和上次移动鼠标的X轴值
        handleEle: null,
        mouseX: 0
    }; 

    this.element = this.create(width);
    this.event();


    //this.ContainerId = "";
    //this.BeginX = 0;
    //this.BeginY = 0;
    //this.EndX = 0;
    //this.EndY = 0;
};

SuperFrame.prototype.setColProp = function (prop) {
    if (this.colCount == 3)
        this.colProp = prop;
    else if (this.colCount == 2)
        this.colProp = new Array(5, 5);
    else
        this.colProp = [10];
};

SuperFrame.prototype.createFrameForm = function (aimE, showFn, okFn, noFN) {
    var me = this, frameIndex = aimE.parents(".topicedit_frame").index();

    function createHtml() {
        var html = '<div>框架模式：<select id="topic_superframe_colcountsetting_' + frameIndex + '">', cnNs = ["单", "双", "三"];
        for (var i = 0; i < 3; i++) {
            if (i + 1 == me.colCount) {
                html += '<option value="' + (i + 1) + '" selected="selected">' + cnNs[i] + '列框架</option>';
            } else {
                html += '<option value="' + (i + 1) + '">' + cnNs[i] + '列框架</option>';
            }
        }
        html += '</select></div>';

        return html;
    };

    var dd = dialog({
        title: '框架-' + (frameIndex + 1) + '设置',
        content: createHtml(),
        onshow: showFn,
        width: 300,
        okValue: '确定',
        quickClose: true,
        ok: okFn,
        cancelValue: '取消',
        cancel: noFN
    });
    dd.show(aimE[0]);

    return dd;
};

/*
    框架列数变化，areaList二维数组（[[左集合]，[右集合]，[中集合]]）调整规则（列数从小调整到大，数组不做调整）
    一、3列调整为2列，将[中集合]的数据迁移到[右集合]中
    二、3列调整为1列，或2列调整为1列，则统一将[左集合]和[右集合]的数据迁移到[中集合]中
*/
SuperFrame.prototype.ModAreaListByColCountChange = function (newColCount) {
    var me = this, oldColCount = me.colCount;
    if ((oldColCount == 3 && newColCount == 2) || (oldColCount == 1 && newColCount == 2)) {
        $.each(me.areaList[me.areaList.length - 1], function (i, itemAreaObj) {
            me.areaList[0][me.areaList[0].length] = itemAreaObj;
        });
        me.areaList[me.areaList.length - 1] = [];
    } else if ((oldColCount == 3 && newColCount == 1) || (oldColCount == 2 && newColCount == 1)) {
        for (var i = 0; i < (oldColCount == 2 ? oldColCount : oldColCount - 1); i++) {
            $.each(me.areaList[i], function (j, itemAreaObj) {
                me.areaList[me.areaList.length - 1][me.areaList[me.areaList.length - 1].length] = itemAreaObj;
            });
            me.areaList[i] = [];
        }
    }

    me.colCount = newColCount;
    me.setColProp(TopicEditor.SuperPage.colProp);

    //me.element.html(me.create(TopicEditor.SuperPage.width).html());
    ////整理areaList属性值的代码写这里
    //me.fill();

    if (newColCount == 1) {
        if (me.element.find("div[class^='topic_center']").length == 0) me.element.find("div[class^='topic_floatright']").eq(0).after('<div class="topic_center"></div>');
        $.each(me.element.find("div[class^='topic_floatleft'], div[class^='topic_floatright']"), function (i, itemAreaPack) {
            me.element.find("div[class^='topic_center']").eq(0).append($(itemAreaPack).find(".topic_area"));
        });
        me.element.find("div[class^='topic_floatleft'], div[class^='topic_floatright'], div[class^='topicedit_gapinframe'], div[class^='clear']").remove();
        me.element.find(".topic_center").attr("class", "topic_center");
    } else if (newColCount == 2 || newColCount == 3) {
        var profix = 'topic_' + me.colCount + '_';
        if (me.element.find("div[class^='topic_floatleft'], div[class^='topic_floatright']").length == 0) {
            me.element.find("div[class^='topic_center']").eq(0).before('<div class="topic_floatleft ' + profix + 'w_' + me.colProp[0] + '"></div><div class="topic_floatright ' + profix + 'w_' + me.colProp[1] + '"></div>');
            me.element.find("div[class^='topic_center']").eq(0).after('<div class="clear"></div>');
        }
        if (me.element.find("div[class^='topic_center']").length == 0) {
            me.element.find("div[class^='topic_floatright']").eq(0).after('<div class="topic_center topic_' + me.colCount + '_c_' + me.colProp[2] + '_' + me.colProp[0] + '"></div>');
        }

        if (newColCount == 2) {
            me.element.find(".clear").eq(0).after('<div class="topicedit_gapinframe topic_gap_toleft_5" dragval="1"></div>');
            me.element.find(".topic_floatleft").attr("class", "topic_floatleft topic_" + me.colCount + "_w_" + me.colProp[0]);
            me.element.find(".topic_floatright").attr("class", "topic_floatright topic_" + me.colCount + "_w_" + me.colProp[1]);
            me.element.find("div[class^='topic_floatleft']").eq(0).append(me.element.find("div[class^='topic_center']").eq(0).find(".topic_area"));
            me.element.find("div[class^='topic_center']").remove();
            me.AutoH();
        }

        if (newColCount == 3) {
            me.element.find(".topic_floatleft").attr("class", "topic_floatleft topic_" + me.colCount + "_w_" + me.colProp[0]);
            me.element.find(".topic_floatright").attr("class", "topic_floatright topic_" + me.colCount + "_w_" + me.colProp[2]);
            me.element.find(".topic_center").attr("class", "topic_center topic_" + me.colCount + '_c_' + me.colProp[2] + '_' + me.colProp[0]);
            me.element.find("div[class^='topicedit_gapinframe']").remove();
        }
    }
};

SuperFrame.prototype.create = function (w) {
    var framdiv = document.createElement("div");
    var jqDiv = $(framdiv), me = this;

    jqDiv.attr({ "class": "topic_frame topicedit_frame" });

    var containerHtml = '<div class="topic_w' + w + '">';

    var profix = 'topic_' + this.colCount + '_';
    if (this.colCount == 3) {
        containerHtml += '<div class="topic_floatleft ' + profix + 'w_' + this.colProp[0] + '"></div>';  //<!--左-->
        containerHtml += '<div class="topic_floatright ' + profix + 'w_' + this.colProp[2] + '"></div>';  //<!--右-->
        containerHtml += '<div class="topic_center ' + profix + 'c_' + this.colProp[2] + '_' + this.colProp[0] + '"></div>';  //<!--中-->
    }
    else if (this.colCount == 2) {
        containerHtml += '<div class="topic_floatleft ' + profix + 'w_' + this.colProp[0] + '"></div>';  //<!--左-->
        containerHtml += '<div class="topic_floatright ' + profix + 'w_' + this.colProp[1] + '"></div>';  //<!--右-->
    }
    else
        containerHtml += '<div class="topic_center"></div>';  //<!--通栏框架（中）-->
    if (this.colCount > 1)
        containerHtml += '<div class="clear"></div>';

    if (this.colCount == 2) {
        containerHtml += '<div class="topicedit_gapinframe topic_gap_toleft_5" dragval="1"></div>';
    }
    containerHtml += '</div>';

    containerHtml += '<div class="topicedit_toolsinframe">';
    containerHtml += '<ul>';
    containerHtml += '<li><a href="javascript:;" btnv="tools-setting"><i class="icon-cog"></i></a></li>';
    containerHtml += '<li><a href="javascript:;" btnv="tools-up"><i class="icon-arrow-up"></i></a></li>';
    containerHtml += '<li><a href="javascript:;" btnv="tools-down"><i class="icon-arrow-down"></i></a></li>';
    containerHtml += '<li><a href="javascript:;" btnv="tools-delete"><i class="icon-remove"></i></a></li>';
    containerHtml += '</ul>';
    containerHtml += '</div>';

    jqDiv.html(containerHtml);
    
    return jqDiv;
};

//创建容器后，填充内容
SuperFrame.prototype.fill = function () {
    var me = this, classNames = ["topic_floatleft", "topic_floatright", "topic_center"];

    for (var i = 0; i < me.areaList.length; i++) {
        var areaPack = me.element.find("." + classNames[i]).eq(0);
        if (areaPack[0]) {
            $.each(me.areaList[i], function (j, itemAreaObj) {
                areaPack.append(itemAreaObj.outerHtml());
            });
        }
    }
};

SuperFrame.prototype.event = function () {
    var me = this;

    function del(index) {
        me.element.remove();
        return TopicEditor.SuperPage.frameList.splice(index, 1);
    };
    function moveUp(index) {
        if (index == 0) return;

        TopicEditor.SuperPage.frameList[index - 1].element.before(TopicEditor.SuperPage.frameList[index].element);
        TopicEditor.SuperPage.frameList[index] = TopicEditor.SuperPage.frameList.splice(index - 1, 1, TopicEditor.SuperPage.frameList[index])[0];
        return TopicEditor.SuperPage.frameList;
    };
    function moveDown(index) {
        if (index == TopicEditor.SuperPage.frameList.length - 1) return;

        TopicEditor.SuperPage.frameList[index + 1].element.after(TopicEditor.SuperPage.frameList[index].element);
        TopicEditor.SuperPage.frameList[index] = TopicEditor.SuperPage.frameList.splice(index + 1, 1, TopicEditor.SuperPage.frameList[index])[0];
        return TopicEditor.SuperPage.frameList;
    };

    me.element.bind({
        click: function (e) {
            e = e || event;
            var mouseEle = TopicEditor.Dom.Gt(e);
            if (mouseEle[0].tagName.toLowerCase() == "i" && mouseEle.attr("class").indexOf("icon-") >= -1) {
                var mouseEle = mouseEle.parent("a");
                var parentFrame = mouseEle.parents(".topicedit_frame");
                if (parentFrame[0]) {
                    switch (mouseEle.attr("btnv")) {
                        case "tools-setting":
                            var form = me.createFrameForm(
                                mouseEle,
                                function () {
                                    parentFrame.addClass("topicedit_mouseover");
                                }, 
                                function () {
                                    var selectV = parseInt($("#topic_superframe_colcountsetting_" + parentFrame.index()).val());
                                    if (selectV != me.colCount) {
                                        me.ModAreaListByColCountChange(selectV);
                                        console.log(TopicEditor.SuperPage);
                                    }

                                    parentFrame.removeClass("topicedit_mouseover");
                                }, 
                                function () {
                                    parentFrame.removeClass("topicedit_mouseover");
                                }
                            );
                            
                            break;
                        case "tools-up":
                            moveUp(parentFrame.index());
                            break;
                        case "tools-down":
                            moveDown(parentFrame.index());
                            break;
                        case "tools-delete":
                            if (me.areaList[0].length > 0 || me.areaList[1].length > 0 || me.areaList[2].length > 0) {
                                var dd = dialog({
                                    title: '确定删除框架-' + (parentFrame.index() + 1),
                                    content: '确定删除框架-' + (parentFrame.index() + 1) + '？删除后，该框架下的所有元素也将被一并删除。',
                                    onshow: function () { parentFrame.addClass("topicedit_mouseover"); },
                                    width: 300,
                                    okValue: '确定',
                                    quickClose: true,
                                    ok: function () {
                                        del(parentFrame.index());
                                        parentFrame.removeClass("topicedit_mouseover");
                                    },
                                    cancelValue: '取消',
                                    cancel: function () {
                                        parentFrame.removeClass("topicedit_mouseover");
                                    }
                                });
                                dd.show(mouseEle[0]);
                            } else {
                                del(parentFrame.index());
                                parentFrame.removeClass("topicedit_mouseover");
                            }
                            break;
                        default:
                            moveUp(parentFrame.index());
                            break;
                    }
                }
            }
        },
        mousedown: function (e) {
            e = e || event;
            var mouseEle = TopicEditor.Dom.Gt(e);
            if (mouseEle.hasClass("topicedit_gapinframe")) {
                mouseEle.addClass("topicedit_gapinframecheck");

                me.propHandleFlag = true;
                me.curPropHandle.handleEle = mouseEle;
                me.curPropHandle.mouseX = e.clientX;
                
                var frameDivs = me.element.find(TopicEditor.Setting.AreaPacketSelector);
                if (me.colCount == 2 && frameDivs.length == 2) {
                    mouseEle.before('<div class="topicedit_redgapinframe topic_gap_toleft_' + TopicEditor.SuperPage.colProp[0] + '" style="height:' + me.element.height() + 'px"></div>');
                    mouseEle.before('<div class="topicedit_redgapinframe topic_gap_toleft_5" style="height:' + me.element.height() + 'px"></div>');
                    mouseEle.before('<div class="topicedit_redgapinframe topic_gap_toleft_' + (TopicEditor.SuperPage.colProp[0] + TopicEditor.SuperPage.colProp[1]) + '" style="height:' + me.element.height() + 'px"></div>');

                    frameDivs.eq(0).css("width", frameDivs.eq(0).width() + "px");
                    frameDivs.eq(0).find(".topic_areamask").css("width", frameDivs.eq(0).find(".topic_areamask").eq(0).width() + "px");
                    frameDivs.eq(1).css("width", frameDivs.eq(1).width() + "px");
                    frameDivs.eq(1).find(".topic_areamask").css("width", frameDivs.eq(1).find(".topic_areamask").eq(0).width() + "px");
                }
            }
        }
    });

    $("body").bind({
        mousemove: function (e) {
            e = e || event;

            if (me.propHandleFlag) {
                var nowX = e.clientX;

                var frameDivs = me.element.find(TopicEditor.Setting.AreaPacketSelector);
                if (me.colCount == 2 && frameDivs.length == 2) {
                    frameDivs.eq(0).css("width", (frameDivs.eq(0).width() - (me.curPropHandle.mouseX - nowX)) + "px");
                    frameDivs.eq(0).find(".topic_areamask").css("width", (frameDivs.eq(0).find(".topic_areamask").eq(0).width() - (me.curPropHandle.mouseX - nowX)) + "px");
                    frameDivs.eq(1).css("width", (frameDivs.eq(1).width() + (me.curPropHandle.mouseX - nowX)) + "px");
                    frameDivs.eq(1).find(".topic_areamask").css("width", (frameDivs.eq(1).find(".topic_areamask").eq(0).width() + (me.curPropHandle.mouseX - nowX)) + "px");
                    me.curPropHandle.handleEle.css({ "left": frameDivs.eq(0).width() + "px" });

                    me.curPropHandle.mouseX = nowX;
                }


                //console.log(nowX + " " + me.curPropHandle.mouseX);

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

            var draglimit = 50, frameDivs = me.element.find(TopicEditor.Setting.AreaPacketSelector);
            if (me.colCount == 2 && frameDivs.length == 2 && me.propHandleFlag) {
                var w0 = me.colProp[0], w1 = me.colProp[1], change = false;
                $.each(me.element.find(".topicedit_redgapinframe"), function (i, redgap) {
                    if (Math.abs(me.curPropHandle.handleEle.offset().left - $(redgap).offset().left) < draglimit) {
                        me.colProp[0] = parseInt($(redgap).attr("class").replace(/topicedit_redgapinframe\stopic_gap_toleft_/gi, ""));
                        me.colProp[1] = 10 - me.colProp[0];

                        me.modElementByProp();
                        me.modGapHandlePositionByProp();
                        change = true;

                        return false;
                    }
                });

                if (!change) {
                    me.colProp[0] = w0;
                    me.colProp[1] = w1;

                    me.modElementByProp();
                    me.modGapHandlePositionByProp();
                }

                me.element.find(".topicedit_redgapinframe").remove();

                me.propHandleFlag = false;
                me.curPropHandle.handleEle.removeClass("topicedit_gapinframecheck");
                me.curPropHandle.handleEle = null;
                me.curPropHandle.mouseX = 0;
            }
            
        }
    });
    
};

SuperFrame.prototype.appendTo = function (aimele) {
    aimele.append(this.element);
    this.AutoH();
};
SuperFrame.prototype.afterTo = function (aimele) {
    aimele.after(this.element);
    this.AutoH();
};

SuperFrame.prototype.appendArea = function (areaPacketIndex, newArea) {
    var me = this, classNames = ["topic_floatleft", "topic_floatright", "topic_center"];
    if (me.colCount == 1)
        areaPacketIndex = 2;

    me.areaList[areaPacketIndex][me.areaList[areaPacketIndex].length] = newArea;
    newArea.appendTo(me.element.find("." + classNames[areaPacketIndex]).eq(0));
    me.AutoH();
};
SuperFrame.prototype.afterArea = function (areaPacketIndex, areaIndex, newArea) {
    var me = this;
    if (me.colCount == 1)
        areaPacketIndex = 2;

    me.areaList[areaPacketIndex].splice(areaIndex + 1, 0, newArea);
    newArea.afterTo(me.areaList[areaPacketIndex][areaIndex].element);
    me.AutoH();
};

SuperFrame.prototype.modElementByProp = function () {
    var me = this;
    if (me.colCount == 3) {
        me.element.find(".topic_floatleft").attr("class", "topic_floatleft topic_" + me.colCount + "_w_" + me.colProp[0]);
        me.element.find(".topic_floatright").attr("class", "topic_floatright topic_" + me.colCount + "_w_" + me.colProp[2]);
        me.element.find(".topic_center").attr("class", "topic_center topic_" + me.colCount + "_c_" + me.colProp[2] + "_" + me.colProp[0]);
    }
    else if (me.colCount == 2) {
        me.element.find(".topic_floatleft").attr("class", "topic_floatleft topic_" + me.colCount + "_w_" + me.colProp[0]);
        me.element.find(".topic_floatright").attr("class", "topic_floatright topic_" + me.colCount + "_w_" + me.colProp[1]);
    }
    me.element.find(TopicEditor.Setting.AreaPacketSelector).removeAttr("style");
    me.element.find("div[class^='topic_areamask']").css("width", "");
};

//根据框架（页面）比例，设置框架比例调整拖拽层的位置
SuperFrame.prototype.modGapHandlePositionByProp = function () {
    var me = this;
    if (me.colCount == 3) {
        me.element.find(".topicedit_gapinframe").eq(0).attr("class", "topicedit_gapinframe topic_gap_toleft_" + me.colProp[0]);
        me.element.find(".topicedit_gapinframe").eq(1).attr("class", "topicedit_gapinframe topic_gap_toleft_" + (me.colProp[0] + me.colProp[1]));
    }
    else if (me.colCount == 2) {
        me.element.find(".topicedit_gapinframe").eq(0).attr("class", "topicedit_gapinframe topic_gap_toleft_" + me.colProp[0]);
    }
    me.element.find(".topicedit_gapinframe").css("left", "");
};

//调整框架比例的方法
SuperFrame.prototype.modProp = function (propval) {
    var me = this;
    if (me.colCount == 3 && propval.length == 3) { //调整三列模式的框架比例的逻辑（要求传入比例数组长度必须等于3）
        me.colProp = propval;
    }
    else if (me.colCount == 2 && (propval.length == 3 || propval.length == 2)) { //调整二列模式的框架比例的逻辑（这时传入比例数组长度可为3或2）
        //传入的比例值数组长度
        if (propval.length > me.colCount) { //当传入比例数组长度等于3时，表示页面的三列比例调整了，该二列框架也要做出相应调整
            //左右两边宽度不相等时，需要对相应节点做样式调整
            if (me.colProp[0] != me.colProp[1]) {
                if (me.colProp[0] > me.colProp[1]) { //左边宽度大于右边
                    if (propval[0] + propval[1] != propval[0]) { //三列下，左中相加与两列左宽度不等，需调整
                        me.colProp[0] = propval[0] + propval[1];
                        me.colProp[1] = 10 - me.colProp[0];
                    }

                } else if (me.colProp[0] < me.colProp[1]) { //左边宽度小于右边
                    if (propval[1] + propval[2] != me.colProp[1]) { //三列下，中右相加与两列右宽度不等，需调整
                        me.colProp[1] = propval[1] + propval[2];
                        me.colProp[0] = 10 - me.colProp[1];
                    }
                }
            }
        }
        else { //当传入比例数组长度等于2时，表示该方法是由用户行为触发（也就是手动调整，并不是页面的三列比例调整而触发的）
            me.colProp[0] = propval[0];
            me.colProp[1] = propval[1];
        }
    }
    //修改文档结构
    me.modElementByProp();
    //修改框架比例调整拖拽层的位置
    me.modGapHandlePositionByProp();
};

SuperFrame.prototype.AutoH = function () {
    var me = this;
    if (me.colCount == 2)
        me.element.find(".topicedit_gapinframe").height(me.element.height());
};