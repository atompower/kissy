/**
 * aria support for carousel
 * @author:yiminghe@gmail.com
 */
KISSY.add("switchable/carousel/aria", function(S, DOM, Event, Aria, Carousel) {

    var KEY_PAGEUP = 33;
    var KEY_PAGEDOWN = 34;
    var KEY_END = 35;
    var KEY_HOME = 36;

    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;
    var KEY_TAB = 9;

    var KEY_SPACE = 32;
//    var KEY_BACKSPACE = 8;
//    var KEY_DELETE = 46;
    var KEY_ENTER = 13;
//    var KEY_INSERT = 45;
//    var KEY_ESCAPE = 27;
    var setTabIndex = Aria.setTabIndex;


    function _switch(ev) {
        var self = this;
        var steps = self.config.steps;
        var index = ev.currentIndex;
        var activeIndex = self.activeIndex;
        var panels = self.panels;
        var panel = panels[index * steps];
        var triggers = self.triggers;
        var trigger = triggers[index];

        var domEvent = !!ev.originalEvent.target;

        // dom 事件触发
        if (domEvent
            // 初始化
            || activeIndex == -1) {

            S.each(triggers, function(t) {
                setTabIndex(t, -1);
            });

            S.each(panels, function(t) {
                setTabIndex(t, -1);
            });

            setTabIndex(trigger, 0);
            setTabIndex(panel, 0);

            //dom 事件触发时，才会进行聚焦，否则会干扰用户
            if (domEvent) {
                panel.focus();
            }
        }
    }

    function findTrigger(t) {
        var r;
        S.each(this.triggers, function(trigger) {
            if (trigger == t
                || DOM.contains(trigger, t)) {
                r = trigger;
                return false;
            }
        });
        return r;
    }

    function next(c) {
        var n = DOM.next(c),
            triggers = this.triggers;
        if (!n) {
            n = triggers[0];
        }
        setTabIndex(c, -1);
        setTabIndex(n, 0);
        n.focus();
    }


    function prev(c) {
        var n = DOM.prev(c),
            triggers = this.triggers;
        if (!n) {
            n = triggers[triggers.length - 1];
        }
        setTabIndex(c, -1);
        setTabIndex(n, 0);
        n.focus();
    }

    function _navKeydown(e) {
        var key = e.keyCode,t = e.target,
            c;

        switch (key) {
            case KEY_DOWN:
            case KEY_RIGHT:

                c = findTrigger.call(this, t);
                if (c) {
                    next.call(this, c);
                    e.halt();
                }
                break;

            case KEY_UP:
            case KEY_LEFT:

                c = findTrigger.call(this, t);
                if (c) {
                    prev.call(this, c);
                    e.halt();
                }
                break;

            case KEY_ENTER:
            case KEY_SPACE:

                c = findTrigger.call(this, t);
                if (c) {
                    this.switchTo(S.indexOf(c, this.triggers), undefined, e);
                    e.halt();
                }
                break;
        }
    }

    function findPanel(t) {
        var r;
        S.each(this.panels, function(p) {
            if (p == t || DOM.contains(p, t)) {
                r = p;
                return false;
            }
        });
        return r;
    }


    function nextPanel(c) {
        var n = DOM.next(c),
            panels = this.panels;
        if (!n) {
            n = panels[0];
        }
        setTabIndex(c, -1);
        setTabIndex(n, 0);

        if (checkPanel.call(this, n)) {
            n.focus();
        }
    }


    function prevPanel(c) {
        var n = DOM.prev(c),
            panels = this.panels;
        if (!n) {
            n = panels[panels.length - 1];
        }
        setTabIndex(c, -1);
        setTabIndex(n, 0);
        if (checkPanel.call(this, n)) {
            n.focus();
        }
    }

    function checkPanel(p) {
        var index = S.indexOf(p, this.panels),steps = this.config.steps;
        var dest = Math.floor(index / steps);
        // 在同一个 panel 组，立即返回
        if (dest == this.activeIndex) {
            return 1;
        }
        if (index % steps == 0 || index % steps == steps - 1) {
            //向前动画滚动中，focus，会不正常 ...
            //传递事件，动画后异步 focus
            this.switchTo(dest, undefined, undefined, function() {
                p.focus();
            });
            return 0;
        }
        return 1;
    }


    function _contentKeydown(e) {

        var key = e.keyCode,t = e.target,
            c;

        switch (key) {
            case KEY_DOWN:
            case KEY_RIGHT:

                c = findPanel.call(this, t);
                if (c) {
                    nextPanel.call(this, c);
                    e.halt();
                }
                break;


            case KEY_UP:
            case KEY_LEFT:

                c = findPanel.call(this, t);
                if (c) {
                    prevPanel.call(this, c);
                    e.halt();
                }
                break;

            case KEY_ENTER:
            case KEY_SPACE:

                c = findPanel.call(this, t);
                if (c) {
                    this.fire('itemSelected', { item: c });
                    e.halt();
                }
                break;
        }
    }

    S.mix(Carousel.Config, {
        aria:true
    });

    Carousel.Plugins.push({
        name:"aria",
        init:function(self) {
            if (!self.config.aria) return;

            var triggers = self.triggers;
            var panels = self.panels;
            var content = self.content;
            if (!content.id) {
                content.id = S.guid("ks-switchbale-content");
            }
            content.setAttribute("role", "listbox");
            S.each(triggers, function(t) {
                setTabIndex(t, -1);
                t.setAttribute("role", "button");
                t.setAttribute("aria-controls", content.id);
            });

            S.each(panels, function(t) {
                setTabIndex(t, -1);
                t.setAttribute("role", "option");
            });

            self.on("switch", _switch, self);
            var nav = self.nav;
            if (nav) {
                Event.on(nav, "keydown", _navKeydown, self);
            }

            Event.on(content, "keydown", _contentKeydown, self);

            var prevBtn = self['prevBtn'],
                nextBtn = self['nextBtn'];

            if (prevBtn) {
                setTabIndex(prevBtn, 0);
                prevBtn.setAttribute("role", "button");
                Event.on(prevBtn, "keydown", function(e) {
                    if (e.keyCode == KEY_ENTER || e.keyCode == KEY_SPACE) {
                        self.switchTo(self.activeIndex > 0 ? self.activeIndex - 1 : triggers.length - 1,
                            undefined, e);
                    }
                });
            }

            if (nextBtn) {
                setTabIndex(nextBtn, 0);
                nextBtn.setAttribute("role", "button");
                Event.on(nextBtn, "keydown", function(e) {
                    if (e.keyCode == KEY_ENTER || e.keyCode == KEY_SPACE) {
                        self.switchTo(self.activeIndex == triggers - 1 ? self.activeIndex + 1 : 0,
                            undefined, e);
                    }
                });
            }

        }
    });

}, {
    requires:["dom","event","../aria","./base"]
});

/**
 承玉:2011.05.12

 <h2>键盘快捷键</h2>
 <ul class="list">
 <li><strong>当焦点在上一页 / 下一页时</strong>
 <ul>
 <li>
 enter/space 旋转到上一屏下一屏，并且焦点转移到当前屏的第一个面板
 </li>
 </ul>
 </li>

 <li>
 <strong> 当焦点在导航圆点时</strong>
 <ul>
 <li>
 上/左键：焦点转移到上一个导航圆点
 </li>
 <li>
 下/右键：焦点转移到下一个导航圆点
 </li>
 <li>
 enter/space: 旋转到当前导航圆点代表的滚动屏，并且焦点转移到当前屏的第一个面板
 </li>
 </ul>
 </li>


 <li>
 <strong>当焦点在底部滚动屏某个面板时</strong>
 <ul>
 <li>
 上/左键：焦点转移到上一个面板，必要时滚屏
 </li>
 <li>
 下/右键：焦点转移到下一个面板，必要时滚屏
 </li>
 <li>
 enter/space: 触发 itemSelect 事件，item 为当前面板
 </li>
 </ul>
 </li>
 </ul>
 **/