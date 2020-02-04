/* the main editor - friol 2k20 */

class editor
{
    constructor(cnvsid,edversion,fcap)
    {
        // theme: foreground, background, selection color, comments, keywords, functions, operators, strings, numbers
        this.colorPalette=["#83FFC7","#19432B","#3d9ab3","#c0c0c0","#f01010","#a0c010","#f0f010","#10f010","#03b1fc"];

        this.displayMode=0; // 0 normal, 1 bigscreen

        // key remap: code, normal key, shift key, altgr key
        this.keypressRemap=[[190,'.',':'],[32,' ',' '],[219,'\'','?'],
            [186,'x','X','{','['],[187,'+','*','}',']'],[188,',',';'],[220,'\\','|'],[189,'-','_'],
            [226,'<','>'],
            [48,'0','='],[49,'1','!'],[50,'2','"'],[51,'3','£'],[52,'4','$'],[53,'5','%'],
            [54,'6','&'],[55,'7','/'],[56,'8','('],[57,'9',')']
        ];

        this.cnvsid=cnvsid;
        this.edVersion=edversion;
        this.fontManager=new fontmgr(cnvsid,this.colorPalette);
        this.frameCapturer=fcap;

        this.lineArray=[""];
        //this.lineArray=[];
        //this.lineArray.push("function pippo(a)");
        //this.lineArray.push("logprint(a)");
        //this.lineArray.push("end");
        //this.lineArray.push("pippo(42)");
        
        this.cursory=0;
        this.cursorx=0;
        this.cursorTick=0;
        this.cursorSteps=64;
        
        this.docTopline=0;
        
        this.numTotColumns=60;
        this.numColumns=this.numTotColumns-2;
        this.numRows=22;

        this.editorMode=0; // 0 - inserting text, 1 - command mode
        this.commandList=[]; // list of commands for the command mode
        this.commandPointer=0;

        this.copyBuffer="";
        this.dragging=false;
        this.dragstartx=0;
        this.dragstarty=0;
        this.dragendx=0;
        this.dragendy=0;

        // resize canvas basing on columns/rows width

        var cnvsWidth=(this.numTotColumns*this.fontManager.fontwidth)+(this.numTotColumns*this.fontManager.multiplier)+2;
        var cnvsHeight=this.numRows*this.fontManager.fontheight+6+(this.numRows);

        document.getElementById(this.cnvsid).width=cnvsWidth;
        document.getElementById(this.cnvsid).height=cnvsHeight;

        // init some objects that will be usefull later

        this.scrollBar=new scrollbar(cnvsid,"arrowUp","arrowDown",this.fontManager.multiplier,this.fontManager.fontheight,this.colorPalette);
        this.statusBar=new statusbar(0,0,cnvsid,this.numRows,this.fontManager,this.numTotColumns);
        this.selection=new selection(cnvsid,this.numColumns,this.fontManager,this.lineArray);
        this.undoManager=new undomgr();
        
        this.picoDisplay=new vcdisplay(this.cnvsid);
        this.theLuaEngine=new luaengine(this.picoDisplay,this.statusBar);
        this.synHighlighter=new syntaxHighlighter();

        // event handlers

        this.altGrPressed=false;

        window.addEventListener('keydown', this.handleKeyPress.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        window.addEventListener('dblclick', this.doubleClick.bind(this));
        window.addEventListener('mousedown', this.onmousedown.bind(this));
        window.addEventListener('mouseup', this.onmouseup.bind(this));
        window.addEventListener('mousemove', this.onmousemove.bind(this));
    }

    onmousedown(e)
    {
        this.selection.active=false;

        var x=e.pageX;
        var y=e.pageY;
        x-=document.getElementById(this.cnvsid).offsetLeft;
        y-=document.getElementById(this.cnvsid).offsetTop;

        var charCoord=this.fontManager.getCharCoord(x,y);

        this.dragging=true;
        this.dragstartx=charCoord[0];
        this.dragstarty=charCoord[1];

        if (this.dragstarty<this.lineArray.length)
        {
            if (this.dragstartx>this.lineArray[this.dragstarty].length)
            {
                this.dragstartx=this.lineArray[this.dragstarty].length-1;
            }
        }
    }

    onmouseup(e)
    {
        this.dragging=false;
    }

    onmousemove(e)
    {
        if (this.dragging)
        {
            var x=e.pageX;
            var y=e.pageY;
            x-=document.getElementById(this.cnvsid).offsetLeft;
            y-=document.getElementById(this.cnvsid).offsetTop;
    
            var charCoord=this.fontManager.getCharCoord(x,y);

            if (
                    ((charCoord[0]>this.dragstartx)&&(charCoord[1]>=this.dragstarty)) ||
                    ((charCoord[0]<this.dragstartx)&&(charCoord[1]>this.dragstarty))
            )
            {
                if (charCoord[1]<=this.lineArray.length)
                {
                    if (charCoord[0]>=this.lineArray[charCoord[1]].length)
                    {
                        charCoord[0]=this.lineArray[charCoord[1]].length-1;
                    }

                    this.selection.active=true;
                    this.selection.set(this.dragstartx,this.dragstarty,charCoord[0],charCoord[1]);
                }
            }
            else if (
                    ((charCoord[0]<this.dragstartx)&&(charCoord[1]<=this.dragstarty)) ||
                    ((charCoord[0]>this.dragstartx)&&(charCoord[1]<this.dragstarty))
            )
            {
                if (charCoord[1]<=this.lineArray.length)
                {
                    if (charCoord[0]>=this.lineArray[charCoord[1]].length)
                    {
                        charCoord[0]=this.lineArray[charCoord[1]].length-1;
                    }

                    this.selection.active=true;
                    this.selection.set(charCoord[0],charCoord[1],this.dragstartx,this.dragstarty);
                }
            }
        }
    }

    doubleClick(e)
    {
        // find word in that point and highlight it
        var x=e.pageX;
        var y=e.pageY;
        x-=document.getElementById(this.cnvsid).offsetLeft;
        y-=document.getElementById(this.cnvsid).offsetTop;

        var charCoord=this.fontManager.getCharCoord(x,y);

        this.highlightFromChar(charCoord);
    }

    isLetterOrNumber(str) 
    {
        return str.length === 1 && str.match(/[a-z0-9]/i);
    }    

    highlightWord(x,l)
    {
        var str=this.lineArray[l];
        var rightex,leftex;

        // find right/left extremes
        var xpos=x;
        var found=false;
        while (!found)
        {
            if ((xpos<str.length) && (this.isLetterOrNumber(str[xpos])))
            {
                xpos+=1;
            }
            else
            {
                found=true;
            }
        }
        rightex=xpos;
        if (rightex!=0) rightex-=1;

        xpos=x;
        found=false;
        while (!found)
        {
            if ((xpos>0) && (this.isLetterOrNumber(str[xpos])))
            {
                xpos-=1;
            }
            else
            {
                found=true;
            }
        }
        leftex=xpos;
        if (leftex!=0) leftex+=1;

        this.selection.active=true;
        this.selection.origx=leftex;
        this.selection.endx=rightex;
        this.selection.origline=l;
        this.selection.endline=l;
    }

    highlightFromChar(ccoord)
    {
        var line=ccoord[1];
        if (line>=this.lineArray.length)        
        {
            return;
        }

        var xpos=ccoord[0];
        if (xpos>=this.lineArray[line].length)
        {
            return;
        }

        this.highlightWord(xpos,line);
    }

    countWords()
    {
        var wc=0;
        var charsToRemove=[',',';','.',':','=','<','>'];

        for (var l=0;l<this.lineArray.length;l++)
        {
            var str=this.lineArray[l];
            for (var c of charsToRemove)
            {
                str=str.replace(c,'');
            }

            var arr=str.split(' ');
            for (var c=0;c<arr.length;c++)
            {
                if (arr[c].length>0) wc+=1;
            }
        }

        return wc;
    }

    download(filename, text) 
    {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        this.statusBar.setStatus("File downloaded.");
    }

    countChars()
    {
        var cc=0;
        this.lineArray.forEach(element => { for (const c of element) { cc++; } });
        return cc;
    }

    handleCommand(cmd)
    {
        if (cmd.split(" ")[0]=="test")
        {
            this.lineArray=[];

            if (cmd.split(" ").length!=2)
            {
                this.lineArray.push("-- 16 colorful bars");
                this.lineArray.push("cls(0)");
                this.lineArray.push("for c=0,15 do");
                this.lineArray.push("color(c)");
                this.lineArray.push("rectfill(0,c*8,128,c*8+8)");
                this.lineArray.push("flip()");
                this.lineArray.push("end");
            }
            else if (cmd.split(" ")[1]=="1")
            {
                this.lineArray.push("-- double loop test");
                this.lineArray.push("for i=0,16 do");
                this.lineArray.push("for j=0,16 do");
                this.lineArray.push("color(flr(rnd(16)))");
                this.lineArray.push("rectfill(j*8,i*8,j*8+8,i*8+8)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
            }
            else if (cmd.split(" ")[1]=="2")
            {
                this.lineArray.push("-- 10print");
                this.lineArray.push("y=0");
                this.lineArray.push("c=7");
                this.lineArray.push("x=0");
                this.lineArray.push("cls(c)");
                this.lineArray.push("::jumphere::");
                this.lineArray.push("if rnd(2)>1 then");
                this.lineArray.push("line(x,y,x+c,y+c,1)");
                this.lineArray.push("else");
                this.lineArray.push("line(x,y+c,x+c,y,1)"); 
                this.lineArray.push("end");
                this.lineArray.push("x+=c");
                this.lineArray.push("if x>128 then");
                this.lineArray.push("x=0");
                this.lineArray.push("y+=c");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto jumphere");
            }
            else if (cmd.split(" ")[1]=="3")
            {
                this.lineArray.push("-- sperm-like thingie");
                this.lineArray.push("tm=0");
                this.lineArray.push("::lab::");
                this.lineArray.push("for c=0,128 do");
                this.lineArray.push("cls(0)");
                this.lineArray.push("x0=64+(8*cos(tm))");
                this.lineArray.push("x1=64+(8*cos(tm-0.1))");
                this.lineArray.push("x2=64+(8*cos(tm-0.2))");
                this.lineArray.push("circfill(x0,c,16,7)");
                this.lineArray.push("circfill(x1,c-8,8,6)");
                this.lineArray.push("circfill(x2,c-16,4,5)");
                this.lineArray.push("tm+=0.01");
                this.lineArray.push("flip()");
                this.lineArray.push("end");
                this.lineArray.push("goto lab");
            }
            else if (cmd.split(" ")[1]=="4")
            {
                this.lineArray.push("-- tweetcart #1 - bars");
                this.lineArray.push("a=0");
                this.lineArray.push("tm=0");
                this.lineArray.push("pal(13,8)");
                this.lineArray.push("::cycle::");
                this.lineArray.push("cls()");
                this.lineArray.push("for p=128,0,-8 do");
                this.lineArray.push("b=a");
                this.lineArray.push("a=(p*0.9)+cos(tm*p)*19");
                this.lineArray.push("k=8+((p/8)%5)");
                this.lineArray.push("line(p,118-b,p,114-a,k+1)");
                this.lineArray.push("line(p,128,p,123-a,k)");
                this.lineArray.push("line(p+8,128,p+8,119-a,k)");
                this.lineArray.push("line(p-8,118-a,p,122-a,k)");
                this.lineArray.push("line(p+8,118-a,p,122-a,k)");
                this.lineArray.push("line(p-8,118-a,p,114-a,k)");
                this.lineArray.push("line(p+8,118-a,p,114-a,k)");
                this.lineArray.push("end");
                this.lineArray.push("tm+=0.0001");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");
            }
            else if (cmd.split(" ")[1]=="5")
            {
                this.lineArray.push("-- tweetcart #2 - DNA");
                this.lineArray.push("u=100");
                this.lineArray.push("f=0");
                this.lineArray.push("::cycle::");
                this.lineArray.push("cls(0)");
                this.lineArray.push("f+=1");
                this.lineArray.push("for y=0,126,9 do");
                this.lineArray.push("n=(y+t()*60)/u");
                this.lineArray.push("l=64+(sin((y+f)*0.004)*22)");
                this.lineArray.push("o=16*sin(n)");
                this.lineArray.push("z=0.9*sin(n+0.25)");
                this.lineArray.push("a=2");
                this.lineArray.push("m=3 ");
                this.lineArray.push("if z>0 then");
                this.lineArray.push("a=8");
                this.lineArray.push("m=1");
                this.lineArray.push("end");
                this.lineArray.push("line(l,y,l+o,y,a)");
                this.lineArray.push("line(l-o,y,l,y,m)");
                this.lineArray.push("if z>0 then");
                this.lineArray.push("z*=2");
                this.lineArray.push("circfill(l-o,y,4-z,m)");
                this.lineArray.push("circfill(l+o,y,4+z,a)");
                this.lineArray.push("else"); 
                this.lineArray.push("circfill(l+o,y,4+z,a)");
                this.lineArray.push("circfill(l-o,y,4-z,m)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");
            }
            else if (cmd.split(" ")[1]=="6")
            {
                this.lineArray.push("-- tweetcart #3 - Plasma");
                this.lineArray.push("pal(7,2)");
                this.lineArray.push("pal(5,0)");
                this.lineArray.push("pal(6,1)");
                this.lineArray.push("pal(11,7)");
                this.lineArray.push("tm=0");
                this.lineArray.push("--fillp(0xa5a5)");
                this.lineArray.push("::cycle::");
                this.lineArray.push("w=128");
                this.lineArray.push("k=t()/8");
                this.lineArray.push("for i=0,128,8 do");
                this.lineArray.push("for j=0,128,8 do");
                this.lineArray.push("y=(cos((i/w)-(k*2))*4)-(sin((i/w)+k*4)*2)");
                this.lineArray.push("x=(sin((j/w)-(k*2))*4)-(cos((j/w)+k*4)*2)");
                this.lineArray.push("h=(y+x)/2");
                this.lineArray.push("n=mid(5,7.5-h,11)");
                this.lineArray.push("c=mid(5,8-h,11)");
                this.lineArray.push("rectfill(i,j,i+6,j+6,flr(n))");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");
            }
            else if (cmd.split(" ")[1]=="7")
            {
                // https://twitter.com/lucatron_/status/1096168653735657472
                this.lineArray.push("-- tweetcart #4 - Infinite tunnel");
                this.lineArray.push("c={0,1,2,8,14,15,7}");
                this.lineArray.push("::cycle::");
                this.lineArray.push("for w=3,68,.02 do");
                this.lineArray.push("a=4/w+t()/4");
                this.lineArray.push("k=145/w");
                this.lineArray.push("x=64+cos(a)*k");
                this.lineArray.push("y=64+sin(a)*k");
                this.lineArray.push("i=35/w+2+t()*3");
                this.lineArray.push("j=flr(1.5+abs(6-(flr(i+.5))%12))");
                this.lineArray.push("rect(x-w,y-w,x+w,y+w,c[j])");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");
            }
            else if (cmd.split(" ")[1]=="8")
            {
                // https://twitter.com/jefrsilva/status/968646725626925056
                this.lineArray.push("-- tweetcart #5 - snake");
                this.lineArray.push("p=0");
                this.lineArray.push("c={8,9,10,11,12,1,2}");
                this.lineArray.push("::f::");
                this.lineArray.push("cls()");
                this.lineArray.push("for i=0,127 do");
                this.lineArray.push("s=64+32*sin((i+p)/64)");
                this.lineArray.push("t=c[(i%7)+1]");
                this.lineArray.push("z=64+(i-64)/2");
                this.lineArray.push("circfill(z,s,2,t)");
                this.lineArray.push("line(z,s,i,s,t)");
                this.lineArray.push("circfill(i,s,2,t)");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("p+=1");
                this.lineArray.push("goto f");               
            }
            else if (cmd.split(" ")[1]=="9")
            {
                // https://twitter.com/_matthewsa/status/966408334914957313
                this.lineArray.push("-- tweetcart #6 - wobbly thing");
                this.lineArray.push("p={1,2,8,9}");
                this.lineArray.push("::loop::");
                this.lineArray.push("cls()");
                this.lineArray.push("for i=0,1,0.01 do");
                this.lineArray.push("x=64+(32+sin(t())*7*sin(8*i+t()/2))*cos(i)");
                this.lineArray.push("y=64+(32+sin(t())*7*sin(8*i+t()/2))*sin(i)");
                this.lineArray.push("r=2*(sin(t()/2+i*2)+1)");
                this.lineArray.push("circfill(x,y,r+1,p[flr(4+sin(i)*cos(i)*3-0.5)])");
                this.lineArray.push("end"); 
                this.lineArray.push("flip()");
                this.lineArray.push("goto loop");                
            }
            else if (cmd.split(" ")[1]=="10")
            {
                // https://twitter.com/p01/status/1211799879351226379
                this.lineArray.push("cls()");
                this.lineArray.push("c={1,2,4,9,10,10,7,7,7,7}");
                this.lineArray.push("tm=0");
                this.lineArray.push("::cycle::");
                this.lineArray.push("a=tm/4");
                this.lineArray.push("s=cos(a/4)");
                this.lineArray.push("for i=0,10 do");
                this.lineArray.push("y=rnd(129)");
                this.lineArray.push("x=(y%1)*129");
                this.lineArray.push("g=64-y");
                this.lineArray.push("f=64-x");
                this.lineArray.push("e=0");
                this.lineArray.push("z=abs(g)");
                this.lineArray.push("for h=a,a+3 do");
                this.lineArray.push("r=16+(8*cos(h/3))");
                this.lineArray.push("u=f+(48*cos(h/4))");
                this.lineArray.push("v=g-abs(r*cos(h*.9))");
                this.lineArray.push("r=(r*r)-(u*u)-(v*v)");
                this.lineArray.push("if r>0 then");
                this.lineArray.push("e=max(e,1+(r/88))");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("circfill(flr(x),flr(y),4,c[1+abs(flr(((bxor((f/z)+s,(y/z)+a))%2)*(z/26)+e+(y%1))%9)])");
                this.lineArray.push("end");
                this.lineArray.push("tm+=0.1");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");               
            }
            else if (cmd.split(" ")[1]=="11")
            {
                // https://twitter.com/jordi_ros/status/1221534996516823041
                this.lineArray.push("palarr={0,2,136,8,137,9,10,135,7}");
                this.lineArray.push("for i=0,8 do"); 
                this.lineArray.push("pal(i,palarr[i+1])");
                this.lineArray.push("end");                
                this.lineArray.push("::cycle::");
                this.lineArray.push("cls()");
                this.lineArray.push("for z=8,28 do");
                this.lineArray.push("for n=0,49 do");
                this.lineArray.push("i=n/7-3");
                this.lineArray.push("j=(n%7)-3");
                this.lineArray.push("w=(t()*1.2)-(z/32)+(cos(i/4)/7)+(cos(j/1)/7)");
                this.lineArray.push("u=9*cos(w/8)");
                this.lineArray.push("v=9*cos(w/6)");
                this.lineArray.push("x=64+(i-u/6)*(z*1.5)+u");
                this.lineArray.push("y=64+(j-v/5)*(z*1.5)+v");
                this.lineArray.push("circfill(x,y,6-(z/8),(z-4)/2.8)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto cycle");                
            }
            else if (cmd.split(" ")[1]=="12")
            {
                // floor effect
                this.lineArray.push("-- floor demo effect");
                this.lineArray.push("t=0");
                this.lineArray.push("::s::");
                this.lineArray.push("t+=.01");
                this.lineArray.push("for y=-64,64 do");
                this.lineArray.push("q=16+(8*cos(t+(y/128)))");
                this.lineArray.push("for x=-64,64 do");
                this.lineArray.push("pset(x+64,y+64,(bxor(x/q,y/16-(t*8))%2)+1)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto s");
            }
            else if (cmd.split(" ")[1]=="13")
            {
                // https://twitter.com/guerragames/status/1054595407152525312
                this.lineArray.push("t=0");
                this.lineArray.push("::_::");
                this.lineArray.push("cls(0)");
                this.lineArray.push("t+=.1");
                this.lineArray.push("for y=-64,64,3 do");
                this.lineArray.push("d=((y%6)/3)*3");
                this.lineArray.push("for x=-75+d,64+d,6 do");
                this.lineArray.push("a=atan2(x,y)");
                this.lineArray.push("r=sqrt((x*x)+(y*y))/64");
                this.lineArray.push("c=3*r*cos((r/2)+(a*2)-(t/10))+(2*sin(t/16))");
                this.lineArray.push("rectfill(flr(x+64),flr(y+64),flr(x+68),flr(y+65),flr(7+(c%7)))");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto _");                
            }
            else if (cmd.split(" ")[1]=="15")
            {
                // https://twitter.com/von_rostock/status/1118243773937483777
                this.lineArray.push("-- amigah! ball");
                this.lineArray.push("r=128");
                this.lineArray.push("t=0");
                this.lineArray.push("::_::");
                this.lineArray.push("pal(6,6)");
                this.lineArray.push("cls(6)");
                this.lineArray.push("u=64-40*sin(t)");
                this.lineArray.push("v=99-64*abs(sin(t*2))");
                this.lineArray.push("t+=.005");
                this.lineArray.push("for x=0,r,16 do");
                this.lineArray.push("line(x,0,x,r,2)");
                this.lineArray.push("line(0,x,r,x)");
                this.lineArray.push("end");
                this.lineArray.push("pal(6,8)");
                this.lineArray.push("for i=-29,29 do");
                this.lineArray.push("for j=-29,29 do");
                this.lineArray.push("d=((i*i)+(j*j))/r");
                this.lineArray.push("pal(5,5)");
                this.lineArray.push("if d<6 then");
                this.lineArray.push("pset(i+u+8,j+v-4,5)");
                this.lineArray.push("pal(5,7)");
                this.lineArray.push("pset6(i+u,j+v,7+((4*sin(t)+i/16-j/32-d*sin(i/1499)+abs(flr(i/32+j/16-d*sin(j/1499))))%2),d)");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("end");
                this.lineArray.push("flip()");
                this.lineArray.push("goto _");
            }
            
            // https://twitter.com/lucatron_/status/1169209940197572608

            this.lineArray.push("");

            this.cursorx=0;
            this.cursory=0;

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Program uploaded."
        }
        else if (cmd=="wc")
        {
            // wordcount
            var wc=0;
            wc=this.countWords();

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Word count: "+wc.toString();
        }
        else if (cmd=="cc")
        {
            // char count
            var cc=0;
            cc=this.countChars();

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Char count: "+cc.toString();
        }
/*        
        else if ((cmd=="save")||(cmd=="s"))
        {
            // downloads the text in a .txt file
            var text="";
            this.lineArray.forEach(element => text+=element+'\n');
            this.download("mehd.txt",text);

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "File saved.";
        }
*/
        else if ((cmd=="clear")||(cmd=="cls"))
        {
            // wipes out your text
            this.lineArray=[];
            this.cursorx=0;
            this.cursory=0;

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Text wiped out.";
        }
        else if ((cmd=="ver")||(cmd=="v"))
        {
            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Mehd version "+this.edVersion;
        }
        else if ((cmd=="run")||(cmd=="r"))
        {
            // parse and run code
            this.theLuaEngine.parseAndRun(this.lineArray);

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Running.";
        }
        else if (cmd.split(" ")[0]=="theme")
        {
            if (cmd.split(" ").length!=2)
            {
                return "Theme command without argument.";
            }

            if (cmd.split(" ")[1]=="0")
            {
                this.colorPalette[0]="#83FFC7";
                this.colorPalette[1]="#19432B";
                this.colorPalette[2]="#3d9ab3";
            }
            else if (cmd.split(" ")[1]=="1")
            {
                this.colorPalette[0]="#f0f0f0";
                this.colorPalette[1]="#101010";
                this.colorPalette[2]="#3d9ab3";
            }
            else if (cmd.split(" ")[1]=="2")
            {
                this.colorPalette[0]="#657b83";
                this.colorPalette[1]="#fdf6e3";
                this.colorPalette[2]="#cec8b5";
            }
            else
            {
                this.commandList.push(cmd);
                this.commandPointer=this.commandList.length-1;
                return "Valid themes: 0, 1 or 2.";
            }

            this.fontManager.setColors(this.colorPalette);

            this.fontManager.initFontCanvasArray(this.colorPalette[0],0);
    
            for (var i=0;i<this.colorPalette.length-3;i++)
            {
                this.fontManager.initFontCanvasArray(this.colorPalette[i+3],i+1);
            }
    
            this.fontManager.initReverseCanvasArray();
            this.scrollBar.setColors(this.colorPalette);
            this.scrollBar.initArrowArray();

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Theme changed.";
        }
        else if (cmd=="start capture")
        {
            this.frameCapturer.start();

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Capture started.";
        }
        else if (cmd=="end capture")
        {
            this.frameCapturer.endAndSave();

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Capture ended, saving.";
        }
        else if (cmd=="bigscreen")
        {
            this.displayMode=1; // centered, big display

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Switched to bigscreen mode.";
        }
        else if (cmd=="smallscreen")
        {
            this.displayMode=0; // normal screen

            this.commandList.push(cmd);
            this.commandPointer=this.commandList.length-1;
            return "Switched to small screen mode.";
        }
        else if (cmd.split(" ")[0]=="save")
        {
            if (cmd.split(" ").length!=2)
            {
                return "No filename specified.";
            }

            var quotedFname=cmd.split(" ")[1];
            if (quotedFname.length<3)
            {
                return "Filename should be quoted and not empty.";
            }

            quotedFname=quotedFname.replace(/\"/g,"");

            return this.saveFile(quotedFname);
        }
        else if (cmd.split(" ")[0]=="load")
        {
            if (cmd.split(" ").length!=2)
            {
                return "No filename specified.";
            }
            
            var quotedFname=cmd.split(" ")[1];
            if (quotedFname.length<3)
            {
                return "Filename should be quoted and not empty.";
            }

            quotedFname=quotedFname.replace(/\"/g,"");

            return this.loadFile(quotedFname);
        }
        else
        {
            return "Unknown command";
        }

        return ""; // no cmd
    }

    loadFile(fname)
    {
        $.ajax({
            type: "POST",
            url: '/mehd/loadProgram.php',
            data: { programName:fname },
            dataType: "xml",
            success: function(data)
            {
                var xmlDoc = $.parseXML(data);
                var $xml = $( xmlDoc );
                alert($xml);        
            }
        });
        
        return "Program loaded.";
    }

    saveFile(fname)
    {
        var text="";
        this.lineArray.forEach(element => text+=element+'\n');

        $.ajax({
            type: "POST",
            url: '/mehd/saveProgram.php',
            data: { progName:fname, progText:text },
            dataType: "xml",
            success: function(data)
            {
                var xmlDoc = $.parseXML(data);
                var $xml = $( xmlDoc );
        
                $xml.find("results").each(function() 
                {
                    var rez=$(this).find("result").text();
                    if (rez=="OK")
                    {
                    }
                    else
                    {
                        var err=$(this).find("message").text();
                    }
                });
            }
        });

        return "Saving.";
    }

    copyCurrentSelection()
    {
        if (this.selection.active)
        {
            var copiedText="";
            var curx=this.selection.origx;
            var cury=this.selection.origline;

            var finished=false;
            while (!finished)
            {
                copiedText+=this.lineArray[cury][curx];
                curx++;

                if ((curx>this.selection.endx)&&(cury==this.selection.endline))
                {
                    finished=true;
                }
                else
                {
                    if (curx>=this.lineArray[cury].length)
                    {
                        copiedText+="\n";
                        curx=0;
                        cury+=1;
                    }                
                }
            }

            this.copyBuffer=copiedText;
            var summary=this.copyBuffer;
            if (summary.length>20)
            {
                summary=summary.substr(0,20)+"...";
            }

            this.statusBar.setStatus("Copied string '"+summary+"'");
        }    
    }

    cutCurrentSelection()
    {
        if (this.selection.active)
        {
            if (this.selection.origline==this.selection.endline)
            {
                var str=this.lineArray[this.selection.origline];
                var pre=str.substring(0,this.selection.origx);
                var post=str.substring(this.selection.endx+1);
                this.lineArray[this.selection.origline]=pre+post;
            }            
            else
            {
                var newLineArray=[];
                for (var l=0;l<this.lineArray.length;l++)
                {
                    if (l<this.selection.origline)
                    {
                        newLineArray.push(this.lineArray[l]);
                    }
                    else if (l==this.selection.origline)
                    {
                        newLineArray.push(this.lineArray[l].substring(0,this.selection.origx)+this.lineArray[this.selection.endline].substring(this.selection.endx+1));
                    }
                    else if (l>this.selection.endline)
                    {
                        newLineArray.push(this.lineArray[l]);
                    }
                }                

                this.lineArray=[];
                newLineArray.forEach(element => {
                    this.lineArray.push(element);
                });
            }

            this.selection.active=false;
        }        
    }

    handleCharCombo(code)
    {
        if (code==67) // CTRL-C
        {
            // copy (eventually) selected text
            this.copyCurrentSelection();                
        }
        else if (code==86) // CTRL-V
        {
            // paste what's in copybuffer
            if (this.copyBuffer!="")
            {
                this.lineArray[this.docTopline+this.cursory]+=this.copyBuffer;
                this.cursorx+=this.copyBuffer.length;                
            }
        }
        else if (code==88) // CTRL-X
        {
            // cut
            this.copyCurrentSelection();
            this.cutCurrentSelection();
        }
        else if (code==90) // CTRL-Z
        {
            // undo
            this.undoManager.undoLastAction(this);
        }
    }

    handleKeyUp(e)
    {
        if (e.keyCode==17)
        {
            this.altGrPressed=false;
        }
    }

    handleKeyPress(e)
    {
        if (e.keyCode==8)
        {
            // backspace
            this.selection.active=false;

            if (this.editorMode==0)
            {
                var ch=this.backSpace();
                if (ch!="")
                {
                    this.undoManager.backspace(ch,this);
                }
                e.preventDefault();
                return false;
            }
            else
            {
                this.statusBar.backSpace();
                e.preventDefault();
                return false;
            }
        }
        else if (e.keyCode==9)
        {
            // tab
            this.selection.active=false;

            if (this.editorMode==0)
            {
                //this.lineArray[this.docTopline+this.cursory]+="    ";
                //this.cursorx+=4;

                var prestr=this.lineArray[this.cursory+this.docTopline].substr(0,this.cursorx);
                var poststr=this.lineArray[this.cursory+this.docTopline].substr(this.cursorx);
                this.lineArray[this.cursory+this.docTopline]=prestr+"    "+poststr;
                this.cursorx+=4;

                e.preventDefault();
                return false;
            }
        }
        else if (e.keyCode==17)
        {
            this.altGrPressed=true;
            return false;
        }
        else if (e.keyCode==13)
        {
            // carriage return
            this.selection.active=false;

            if (this.editorMode==0)
            {
                this.cursory++;
                if (this.cursory==(this.numRows-1))
                {
                    this.cursory--;
                    this.docTopline+=1;
                }


                if (this.cursorx==0)
                {
                    this.lineArray.splice(this.cursory-1,0,"");
                }
                else if (this.cursorx==this.lineArray[this.cursory-1+this.docTopline].length)
                {
                    this.lineArray.splice(this.cursory,0,"");
                    this.cursorx=0;
                }
                else
                {
                    var prestr=this.lineArray[this.cursory-1+this.docTopline].substr(0,this.cursorx);
                    var poststr=this.lineArray[this.cursory-1+this.docTopline].substr(this.cursorx);
                    this.lineArray[this.cursory-1+this.docTopline]=prestr;
                    this.lineArray.splice(this.cursory,0,poststr);
                    this.cursorx=0;
                }
                
                this.undoManager.carriageReturn(this);
            }
            else
            {
                // process command
                var curCmd=this.statusBar.currentCommand;
                var retMsg=this.handleCommand(curCmd);

                // and go back to editor mode 0
                this.statusBar.resetCommand();
                this.statusBar.setOutputMessage(retMsg);
                this.statusBar.mode=2;
                this.editorMode=0;
            }
        }
        else if (e.keyCode==27)
        {
            // esc triggers command mode and back
            this.selection.active=false;

            if (this.editorMode==0) 
            {
                this.editorMode=1;
                this.statusBar.setMode(1);
            }
            else
            {
                this.editorMode=0;
                this.statusBar.setMode(0);
            }
        }
        else if (e.keyCode==36)
        {
            // beg
            if (this.editorMode==0)
            {
                if (e.ctrlKey)
                {
                    this.cursorx=0;
                    this.cursory=0;
                    this.docTopline=0;        
                }
                else
                {
                    this.cursorx=0;
                }
            }
        }
        else if (e.keyCode==35)
        {
            // end
            if (this.editorMode==0)
            {
                if (e.ctrlKey)
                {
                    this.cursorx=0;
                    this.cursory=this.lineArray.length;
                }
                else
                {
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
        }
        else if (e.keyCode==37)
        {
            // arrow left
            if (this.editorMode==0)
            {
                if (this.cursorx>0)
                {
                    this.cursorx--;
                }
                else if (this.cursory>0)
                {
                    this.cursory-=1;
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
        }
        else if (e.keyCode==39)
        {
            // arrow right
            if (this.editorMode==0)
            {
                if (this.cursorx<this.lineArray[this.cursory+this.docTopline].length)
                {
                    this.cursorx++;
                }
                else
                {
                    if (this.cursory<this.lineArray.length)
                    {
                        this.cursorx=0;
                        this.cursory+=1;
                    }
                }
            }
        }
        else if (e.keyCode==38)
        {
            // arrow up
            if (this.editorMode==0)
            {
                if (this.cursory==0)
                {
                    if (this.docTopline>0)
                    {
                        this.docTopline--;
                    }
                }
                else
                {
                    this.cursory--;
                }

                if (this.cursorx>this.lineArray[this.cursory+this.docTopline].length)
                {
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
            else
            {
                if (this.commandList.length>0)
                {
                    if (this.commandPointer>=0)
                    {
                        this.statusBar.currentCommand=this.commandList[this.commandPointer];
                        this.statusBar.cursorPosx=this.statusBar.currentCommand.length+1;
                        if (this.commandPointer>0)
                        {
                            this.commandPointer--;
                        }
                    }
                }
            }
        }
        else if (e.keyCode==40)
        {
            // arrow down
            if (this.editorMode==0)
            {
                if (this.cursory<this.lineArray.length)
                {
                    if (this.cursory==(this.numRows-1))
                    {
                        this.docTopline++;
                    }
                    else
                    {
                        this.cursory++;
                    }
                }

                if (this.cursorx>this.lineArray[this.cursory+this.docTopline].length)
                {
                    this.cursorx=this.lineArray[this.cursory+this.docTopline].length;
                }
            }
            else
            {
                if (this.commandList.length>0)
                {
                    if (this.commandPointer<this.commandList.length-1)
                    {
                        this.commandPointer++;
                        this.statusBar.currentCommand=this.commandList[this.commandPointer];
                        this.statusBar.cursorPosx=this.statusBar.currentCommand.length+1;
                        if (this.commandPointer==(this.commandList.length-1))
                        {
                            this.commandPointer--;
                        }
                    }
                }

            }
        }
        else if (e.keyCode==46)
        {
            // "canc" (delete)
            if (this.editorMode==0)
            {
                if (this.cursorx<this.lineArray[this.cursory+this.docTopline].length)
                {
                    var prestr=this.lineArray[this.cursory+this.docTopline].substr(0,this.cursorx);
                    var poststr=this.lineArray[this.cursory+this.docTopline].substr(this.cursorx+1);
                    this.lineArray[this.cursory+this.docTopline]=prestr+poststr;
                }
                else
                {
                    if (this.cursory<this.lineArray.length)
                    {
                        var endline=this.lineArray[this.cursory+1+this.docTopline];
                        var startline=this.lineArray[this.cursory+this.docTopline];
                        this.lineArray.splice(this.cursory+1+this.docTopline,1);
                        this.lineArray[this.cursory+this.docTopline]+=endline;
                    }
                }
            }
        }
        else
        {
            var charToAdd="";
            if ((e.keyCode>='A'.charCodeAt(0))&&(e.keyCode<='Z'.charCodeAt(0)))
            {
                if (e.ctrlKey)
                {
                    // handle special combinations (like ctrl-c, ctrl-v, etc.)
                    this.handleCharCombo(e.keyCode);
                }
                else
                {
                    var kc=e.keyCode;
                    if (!e.shiftKey) kc+=32;
                    charToAdd=String.fromCharCode(kc);
                    this.selection.active=false;
                }
            }
            else if ((e.keyCode>=48)&&(e.keyCode<=57)&&(!e.shiftKey))
            {
                var kc=e.keyCode;
                charToAdd=String.fromCharCode(kc);
                this.selection.active=false;
            }
            else
            {
                // try to remap the keycode
                for (var m=0;m<this.keypressRemap.length;m++)
                {
                    if (this.keypressRemap[m][0]==e.keyCode)
                    {
                        if (e.shiftKey && !this.altGrPressed)
                        {
                            charToAdd=this.keypressRemap[m][2];
                            break;
                        }
                        else if (this.altGrPressed&&e.shiftKey)
                        {
                            charToAdd=this.keypressRemap[m][3];    
                            break;
                        }
                        else if (this.altGrPressed&&(!e.shiftKey))
                        {
                            charToAdd=this.keypressRemap[m][4];    
                            break;
                        }
                        else
                        {
                            charToAdd=this.keypressRemap[m][1];
                            break;
                        }
                    }
                }
            }

            if (charToAdd!="")
            {
                if (this.editorMode==0)
                {
                    this.addChar(charToAdd);
                    this.undoManager.addChar(this.cursorx-1,this.cursory);
                    this.selection.active=false;
                }
                else
                {
                    this.statusBar.addChar(charToAdd);
                    this.selection.active=false;
                }

                return false;
            }
        }

        return true;
    }

    backSpace()
    {
        var str=this.lineArray[this.docTopline+this.cursory];

        if (str.length==0)
        {
            if (this.cursory==0)
            {
                return "";
            }
            else
            {
                this.cursory--;
                this.cursorx=this.lineArray[this.docTopline+this.cursory].length;
                this.lineArray.splice(this.cursory+1+this.docTopline,1);
                return "\n";
            }
        }
        else
        {
            if (this.cursorx==this.lineArray[this.cursory+this.docTopline].length)
            {
                var removedChar=str[str.length-1];
                str=str.substring(0, str.length - 1);
                this.lineArray[this.docTopline+this.cursory]=str;
                this.cursorx--;
                return removedChar;
            }
            else
            {
                if (this.cursorx!=0)
                {
                    var removedChar=str[this.cursorx-1];
                    str=str.substring(0, this.cursorx - 1)+str.substring(this.cursorx);
                    this.lineArray[this.docTopline+this.cursory]=str;
                    this.cursorx--;
                    return removedChar;
                }
                else
                {
                    // concat previous line with current one
                    if (this.cursory!=0)
                    {
                        var endline=this.lineArray[this.cursory+this.docTopline];
                        var startline=this.lineArray[this.cursory-1+this.docTopline];
                        this.lineArray.splice(this.cursory+this.docTopline,1);
                        this.lineArray[this.cursory-1+this.docTopline]+=endline;
                        this.cursory--;
                        this.cursorx=startline.length;
                        return "";
                    }
                }
            }
        }
    }

    rearrangeLines(curpos)
    {
        var curline=this.lineArray[curpos];
        var lastSpacePos=curline.lastIndexOf(" ");
        var newCurLine=curline.substring(0,lastSpacePos);
        var lastWord=curline.substring(lastSpacePos+1);
        this.lineArray[curpos]=newCurLine;

        if (this.lineArray.length==(curpos+1))
        {
            this.lineArray.push(lastWord);
            this.cursorx=lastWord.length;
        }
    }

    addChar(ch)
    {
        if (this.lineArray.length==0)
        {
            this.lineArray.push("");
        }

        if (this.cursorx==this.lineArray[this.docTopline+this.cursory].length)
        {
            this.lineArray[this.docTopline+this.cursory]+=ch;
        }
        else
        {
            var linebeg=this.lineArray[this.docTopline+this.cursory].substr(0,this.cursorx);
            var lineend=this.lineArray[this.docTopline+this.cursory].substr(this.cursorx);
            this.lineArray[this.docTopline+this.cursory]=linebeg+ch+lineend;
        }

        if (this.lineArray[this.docTopline+this.cursory].length==this.numColumns)
        {
            this.rearrangeLines(this.docTopline+this.cursory);
            this.cursory+=1;
            if (this.cursory==(this.numRows-1))
            {
                this.cursory--;
                this.docTopline++;
            }
        }
        else
        {
            this.cursorx++;
        }
    }

    drawLine(l,row)
    {
        var lineInfo=this.synHighlighter.highlight(l);
        var infoPos=0;

        for (var ch=0;ch<l.length;ch++)
        {
            var coloured=false;
            for (var el=0;el<lineInfo.length;el++)
            {
                if ((ch>=lineInfo[el][0])&&(ch<=lineInfo[el][1]))                 
                {
                    this.fontManager.drawChar(ch,row,l[ch],1,false,lineInfo[el][2]);
                    coloured=true;
                }
            }

            if (!coloured)
            {
                this.fontManager.drawChar(ch,row,l[ch],1,false,0);
            }
        }
    }

    drawCursor()
    {
        this.fontManager.drawCursor(this.cursorx,this.cursory,this.cursorTick,this.cursorSteps,false);
    }

    update()
    {
        this.cursorTick++;
        if (this.cursorTick>=this.cursorSteps)
        {
            this.cursorTick=0;
        }

        this.statusBar.updateCursor(this.cursory,this.cursorx,this.cursorTick,this.cursorSteps);
        this.statusBar.update();
    }

    draw()
    {
        // clear screen

        const canvas=document.getElementById(this.cnvsid);
        const context = canvas.getContext('2d');
        context.fillStyle=this.colorPalette[1];
        context.fillRect(0, 0, canvas.width, canvas.height);

        // draw eventual selection
        this.selection.update(this.lineArray);
        this.selection.draw();

        // draw lines of text

        var row=0;
        for (var line=this.docTopline;line<this.docTopline+this.numRows;line++)
        {
            if (line<this.lineArray.length)
            {
                this.drawLine(this.lineArray[line],row);
            }

            row++;
        }

        if (this.editorMode==0)
        {
            // draw cursor in editing space
            this.drawCursor();
        }

        // draw status bar
        this.statusBar.draw();

        // draw scrollbar
        this.scrollBar.draw();

        // update&draw display
        this.picoDisplay.update();
        this.picoDisplay.draw(this.displayMode);
    }
}
