function SuperPage(w, prop) {
    //this.topiceditor = null;
    this.width = (w && typeof (w)) == "number" ? w : 1000;
    this.colProp = this.convertPropArray(prop); //比例数组：三列new Array(左, 中, 右)，二列new Array(左, 右)
    this.areaPosition = [-1, -1, -1]; //定义移动区域的坐标，数组中三个数值分别表示[框架索引值, 区块索引值, 区块中对应的区域列表索引值]，即：[frameIndex, areaPacketIndex, areaListIndex]

    this.frameList = [];
};

SuperPage.prototype.convertPropArray = function (strprop) {
    if (strprop) {
        var regProp = /^[3,4]:[3,4]:[3,4]$/gi
        if (typeof (strprop) == "string" && regProp.test(strprop)) {
            var prop = strprop.split(':'), propnums = [];
            for (var i = 0; i < prop.length; i++) {
                propnums[propnums.length] = parseInt(prop[i]);
            }
            return propnums;
        }
        else
            return new Array(3, 4, 3);
    } else 
        return new Array(3, 4, 3);
};

SuperPage.prototype.selectFrameByMouseover = function (nowX, nowY) {
    var selectIndex = -1;
    $.each(this.frameList, function (i, itemFrame) {
        if (nowX > itemFrame.element.offset().left && nowX < (itemFrame.element.offset().left + itemFrame.element.width()) && nowY > itemFrame.element.offset().top && nowY < (itemFrame.element.offset().top + itemFrame.element.height())) {
            selectIndex = i;
            return false;
        }
    });
    
    return {
        indexNum: selectIndex,
        FrameObj: selectIndex == -1 ? undefined : this.frameList[selectIndex]
    };
};

SuperPage.prototype.selectAreaPacketByMouseover = function (nowX, nowY) {
    var selectAreaPacketIndex = -1, areaClasses = ["topic_floatleft", "topic_floatright", "topic_center"];
    var frame = this.selectFrameByMouseover(nowX, nowY);
    if (frame.indexNum > -1) {
        var checkArea;
        for (var i = 0; i < frame.FrameObj.colCount; i++) {
            if (i == 0 && frame.FrameObj.colCount == 1) {//当为单列框架时，强行取topic_center的列
                selectAreaPacketIndex = 2;
                checkArea = frame.FrameObj.element.find("div[class^='" + areaClasses[selectAreaPacketIndex] + "']").eq(0);
                break;
            }
            else {
                checkArea = frame.FrameObj.element.find("div[class^='" + areaClasses[i] + "']").eq(0);
                if (nowX > $(checkArea).offset().left && nowX < ($(checkArea).offset().left + $(checkArea).width()) && nowY > $(checkArea).offset().top && nowY < ($(checkArea).offset().top + $(checkArea).height())) {
                    selectAreaPacketIndex = i;
                    break;
                }
            }
            
        }
    }

    return {
        frameIndex: frame.indexNum,
        FrameObj: frame.FrameObj,
        areaPacketIndex: selectAreaPacketIndex,
        AreaPagetObj: selectAreaPacketIndex == -1 ? undefined : (frame.FrameObj.colCount == 1 ? frame.FrameObj.element.find(TopicEditor.Setting.AreaPacketSelector).eq(0) : frame.FrameObj.element.find(TopicEditor.Setting.AreaPacketSelector).eq(selectAreaPacketIndex))
    };
};

SuperPage.prototype.selectAreaByMouseover = function (frameindex, apindex, nowX, nowY) {
    var me = this, selectAreaIndex = -1;
    var apObj = me.selectAreaPacketByMouseover(nowX, nowY);
    if (apObj.frameIndex > -1 && apObj.areaPacketIndex > -1) {
        if (me.frameList[frameindex].areaList[apindex].length > 0) {
            $.each(me.frameList[frameindex].areaList[apindex], function (i, itemArea) {
                if (nowX > itemArea.element.offset().left && nowX < (itemArea.element.offset().left + itemArea.element.width()) && nowY > itemArea.element.offset().top && nowY < (itemArea.element.offset().top + itemArea.element.height())) {
                    selectAreaIndex = i;
                    return false;
                }
            });
        }
    }

    return {
        frameIndex: apObj.frameIndex,
        FrameObj: apObj.FrameObj,
        areaPacketIndex: apObj.areaPacketIndex,
        AreaPagetObj: apObj.AreaPagetObj,
        areaIndex: selectAreaIndex,
        AreaObj: selectAreaIndex == -1 ? undefined : me.frameList[frameindex].areaList[apindex][selectAreaIndex]
    };
};

SuperPage.prototype.getFramesHeight = function () {
    var me = this, totalH = 0;
    $.each(me.frameList, function (i, itemFrame) {
        totalH += itemFrame.element.outerHeight();
    });
    return totalH;

    //return 1500;
};
