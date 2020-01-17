/* lua engine - parser and execution engine */

class luaengine
{
    constructor(vcdisplay)
    {
        var tempGrammar=document.getElementById("luaGrammar").innerText;
        this.parsetree=null;
        this.vcDisplay=vcdisplay;

        this.totCycles=0;
        this.numInstructionsPerInterval=5;
        this.currentInstruction=0;
        this.level=0;
        this.localScope={};
        this.globalScope={};

        try
        {
            this.parser=peg.generate(tempGrammar);
        }
        catch(e)
        {
            alert("Exception parsing internal LUA grammar ["+e.toString()+"]");
        }
    }

    // helpers

    componentToHex(c) 
    {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    
    rgbToHex(r, g, b) 
    {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    parseAndRun(txtarr)
    {
        try
        {
            var program="";

            for (var i=0;i<txtarr.length;i++)
            {
                if (txtarr[i].length>0)
                {
                    program+=txtarr[i]+"\n";
                }
            }

            this.parsetree=this.parser.parse(program);

            this.currentInstruction=0;
            this.level=0;
            this.localScope={};
            this.globalScope={};
    
            this.execute(this.parsetree);
        }
        catch(e)
        {
            alert("Syntax error: ["+e.toString()+"]");
        }
    }

    evaluateExpression(e)
    {
        if (typeof e == 'number')
        {
            // expression is an immediate number
            return ['NUMBER',e];
        }
        else if (typeof e == 'string')
        {
            // expression is a string
            return ['STRING',e];
        }
        else if ((typeof e=='object')&&(e.length>0)&&(e[0]=='FUNCTIONCALL'))
        {
            var funName=e[1];
            var funArgList=e[2];

            var parsedArgList=[];
            if (funArgList!=null)
            {
                var arglistType=funArgList[0];
                if (arglistType!="FUNARGLIST")
                {
                    return "Error: no FUNARGLIST in function call.";
                }

                var argList=funArgList[1];
                argList.forEach(arg =>
                    {
                        parsedArgList.push(this.evaluateExpression(arg));
                    }
                );
            }

            var retobj=new Object();
            var ret=this.execFunctionCall(funName,parsedArgList,retobj);
            if (typeof retobj.result=='number') return ['NUMBER',retobj.result];
            if (typeof retobj.result=='string') return ['STRING',retobj.result];
        }
        else if ((typeof e=='object')&&(e.length>0)&&(e[0]=='VARIABLE'))
        {
            var variableName=e[1];

            // search variable name in local/global scope

            if (variableName in this.localScope)
            {
                if (typeof this.localScope[variableName]=='string')
                {
                    return ['STRING',this.localScope[variableName]];
                }
                else if (typeof this.localScope[variableName]=='number')
                {
                    return ['NUMBER',this.localScope[variableName]];
                }
            }
            else if (variableName in this.globalScope)
            {
                if (typeof this.globalScope[variableName]=='string')
                {
                    return ['STRING',this.globalScope[variableName]];
                }
                else if (typeof this.globalScope[variableName]=='number')
                {
                    return ['NUMBER',this.globalScope[variableName]];
                }
            }
        }
        else if (typeof e === 'object')
        {
            if (e.operator=="+")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]+this.evaluateExpression(e.right)[1]];
            }
            else if (e.operator=="-")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]-this.evaluateExpression(e.right)[1]];
            }
            else if (e.operator=="*")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]*this.evaluateExpression(e.right)[1]];
            }
            else if (e.operator=="\/")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]*this.evaluateExpression(e.right)[1]];
            }
            else if (e.operator=="%")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]%this.evaluateExpression(e.right)[1]];
            }
        }
    }

    execFunctionCall(fname,arglist,objres)
    {
        // library functions first
        if (fname=="rectfill")
        {
            // rectfill(0,0,127,127,7)
            if ((arglist.length!=5)&&(arglist.length!=4))
            {
                return [1,"Wrong num of args for rectfill."];
            }

            var x0=arglist[0][1];
            var y0=arglist[1][1];
            var x1=arglist[2][1];
            var y1=arglist[3][1];

            var palcol=-1;
            if (arglist.length==5) palcol=arglist[4][1];            

            if ((palcol<-1)||(palcol>15)) return [1,"Colors from 0 to 15 are allowed in rectfill."];

            this.vcDisplay.rectfill(x0,y0,x1,y1,palcol);
        }
        else if (fname=="line")
        {
            if ((arglist.length!=2)&&(arglist.length!=3)&&(arglist.length!=4)&&(arglist.length!=5))
            {
                return [1,"Wrong num of args for line."];
            }

            this.vcDisplay.line(arglist);
        }
        else if (fname=="circfill")
        {
            if ((arglist.length!=2)&&(arglist.length!=3)&&(arglist.length!=4))
            {
                return [1,"Wrong num of args for circfill."];
            }

            this.vcDisplay.circfill(arglist);            
        }
        else if (fname=="color")
        {
            if (arglist.length!=1)
            {
                return [1,"color function call without argument."];
            }

            var palcol=arglist[0][1];
            if ((palcol<-1)||(palcol>15)) return [1,"Colors from 0 to 15 are allowed in color call."];

            this.vcDisplay.setPenColor(arglist[0][1]);
        }
        else if (fname=="cls")
        {
            var palcol=-1;
            if (arglist.length==1)
            {
                palcol=arglist[0][1];
            }

            this.vcDisplay.cls(palcol);
        }
        else if (fname=="flip")
        {
            // fixme
            this.vcDisplay.draw();
        }
        else if (fname=="logprint")
        {
            var msg=arglist[0][1];
            alert(msg);
        }
        else if (fname=="pset")
        {
            if ((arglist.length!=2)&&(arglist.length!=3))
            {
                return [1,"pset requires 2 or 3 arguments."];
            }

            var x=arglist[0][1];
            var y=arglist[1][1];

            if ((x<0)||(x>this.vcDisplay.dimx-1)||(y<0)||(y>this.vcDisplay.dimy-1))
            {
            }
            else
            {
                var palcol=-1;
                if (arglist.length==3) palcol=arglist[2][1];
                this.vcDisplay.pset(x,y,palcol);
            }
        }
        else if (fname=="pget")
        {
            if (arglist.length!=2)
            {
                return [1,"pget requires 2 arguments."];
            }

            objres.result=0;

            var x=arglist[0][1];
            var y=arglist[1][1];

            if ((x<0)||(x>this.vcDisplay.dimx-1)||(y<0)||(y>this.vcDisplay.dimy-1))
            {
            }
            else
            {
                var p=this.vcDisplay.srcContext.getImageData(x, y, 1, 1).data; 
                var hex = ("#" + ("000000" + this.rgbToHex(p[0], p[1], p[2])).slice(-6)).toUpperCase();
                for (var c=0;c<this.vcDisplay.palette.length;c++)
                {
                    if (hex==this.vcDisplay.palette[c])
                    {
                        objres.result=c;
                        break;
                    }
                }
            }
        }
        else if (fname=="rnd")
        {
            // fixme

            if (arglist.length!=1)
            {
                return [1,"rnd function call without argument."];
            }

            var rndMax=arglist[0][1];
            objres.result=Math.floor(Math.random()*rndMax);
        }
        else if (fname=="sin")
        {
            if (arglist.length!=1)
            {
                return [1,"sin function call without argument."];
            }
            
            var angle=arglist[0][1];
            var realAngle=-angle*Math.PI*2;
            objres.result=Math.sin(realAngle);
        }
        else if (fname=="cos")
        {
            if (arglist.length!=1)
            {
                return [1,"cos function call without argument."];
            }
            
            var angle=arglist[0][1];
            var realAngle=-angle*Math.PI*2;
            objres.result=Math.cos(realAngle);
        }
        else if (fname=="srand")
        {
            // fixme - do nothing for now
        }
        else if ((fname=="t")||(fname=="time"))
        {
            objres.result=this.vcDisplay.time();
        }
        else
        {
            return [1,"Unknown function "+fname+"."];
        }

        return [0,"Ok"];
    }

    execute(instructions)
    {
        // comments are ignored

        while (this.currentInstruction<instructions.length)
        {
            var element=instructions[this.currentInstruction];
            var eltype=element[0][0];
            
            if (eltype=="ASSIGNMENT")
            {
                var varName=element[0][1][1];
                var varValue=this.evaluateExpression(element[0][2])[1];
                if (this.level==0)
                {
                    this.globalScope[varName]=varValue;
                }
            }
            else if (eltype=="INCREMENT")
            {
                var varName=element[0][1][1];
                var varValue=this.evaluateExpression(element[0][2])[1];
                if (this.level==0)
                {
                    this.globalScope[varName]+=varValue;
                }
            }
            else if (eltype=="FUNCTIONCALL")
            {
                var funName=element[0][1];
                var funArgList=element[0][2];

                var parsedArgList=[];
                if (funArgList!=null)
                {
                    var arglistType=funArgList[0];
                    if (arglistType!="FUNARGLIST")
                    {
                        console.log("Error: no FUNARGLIST in function call.");
                        return;
                    }

                    var argList=funArgList[1];
                    argList.forEach(arg =>
                        {
                            parsedArgList.push(this.evaluateExpression(arg));
                        }
                    );
                }

                var retobj=new Object();
                var ret=this.execFunctionCall(funName,parsedArgList,retobj);
                if (ret[0]!=0) 
                {
                    console.log(ret[1]);
                    return;
                }
            }
            else if (eltype=="FOR")
            {
                var cycleVariable=element[0][1][1];
                var cycleFrom=this.evaluateExpression(element[0][2])[1];
                var cycleTo=this.evaluateExpression(element[0][3])[1];
                
                var stride;
                
                if (element[0][5]!=null) stride=this.evaluateExpression(element[0][5])[1];
                else stride=1;

                this.level+=1;
                this.localScope[cycleVariable]=0;
                for (var i=cycleFrom;i<=cycleTo;i++)
                {
                    this.localScope[cycleVariable]=i;
                    this.execute(element[0][4]);
                }
                this.level-=1;
            }
            else if (eltype=="GOTO")
            {
                var gotoLabel=element[0][1][1];
                for (var ins=0;ins<instructions.length;ins++)
                {
                    if ((instructions[ins][0][0]=='LABEL')&&(instructions[ins][0][1]==gotoLabel))
                    {
                        this.currentInstruction=ins;
                    }
                }
            }

            this.currentInstruction+=1;
            this.totCycles+=1;

            if ((this.totCycles%this.numInstructionsPerInterval)==0)
            {
                window.setTimeout(this.execute.bind(this),0,instructions);
                return;
            }
        }
    }
}
