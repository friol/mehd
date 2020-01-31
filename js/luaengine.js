/* lua engine - parser and execution engine */

class luaengine
{
    constructor(vcdisplay)
    {
        var tempGrammar=document.getElementById("luaGrammar").innerText;
        this.parsetree=null;
        this.vcDisplay=vcdisplay;

        this.totCycles=0;
        this.numInstructionsPerInterval=32;

        // format: [[blocktype,instrBlockPointer,instructionPC,forend,forstride,forvariable],...]
        // blocktype may be "I" (instruction block) and "F" (for block) - for block gets repeated
        this.pcStack=[]; 

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

            this.pcStack=[['I',this.parsetree,0,null,null,null,null,null]];
            this.level=0;
            this.localScope={};
            this.globalScope={};
    
            this.execute();
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
        else if ((typeof e=='object')&&(e.length>0)&&(e[0]=='ARRAYELEMENT'))
        {
            var arrName=e[1][1];
            var arrIndex=this.evaluateExpression(e[2])[1];

            if (arrName in this.globalScope)
            {
                if (typeof this.globalScope[arrName][arrIndex-1]=='number')
                {
                    return ['NUMBER',this.globalScope[arrName][arrIndex-1]];
                }
            }
            else if (arrName in this.localScope)
            {
                if (typeof this.localScope[arrName][arrIndex-1]=='number')
                {
                    return ['NUMBER',this.localScope[arrName][arrIndex-1]];
                }
            }

            throw("Exception: can't find array name "+arrName+" in global or local scope or index oob");
        }
        else if (typeof e === 'object')
        {
            if ((e.length==3)&&(e[0]=="{"))
            {
                // array initialization
                return e[1];
            }
            else if (e.operator=="+")
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
                return ['NUMBER',this.evaluateExpression(e.left)[1]/this.evaluateExpression(e.right)[1]];
            }
            else if (e.operator=="%")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]%this.evaluateExpression(e.right)[1]];
            }
            else if (e.operator=="^")
            {
                return ['NUMBER',this.evaluateExpression(e.left)[1]**this.evaluateExpression(e.right)[1]];
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

            this.vcDisplay.rectfill(x0,y0,x1,y1,palcol,true);
        }
        else if (fname=="rect")
        {
            if ((arglist.length!=5)&&(arglist.length!=4))
            {
                return [1,"Wrong num of args for rect."];
            }

            var x0=arglist[0][1];
            var y0=arglist[1][1];
            var x1=arglist[2][1];
            var y1=arglist[3][1];

            var palcol=-1;
            if (arglist.length==5) palcol=arglist[4][1];            

            if ((palcol<-1)||(palcol>15)) return [1,"Colors from 0 to 15 are allowed in rect."];

            this.vcDisplay.rectfill(x0,y0,x1,y1,palcol,false);
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
        else if (fname=="pal")
        {
            this.vcDisplay.dopal(arglist);
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
            this.vcDisplay.flip();
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
            objres.result=Math.random()*rndMax;
        }
        else if (fname=="sin")
        {
            if (arglist.length!=1)
            {
                return [1,"sin function call without argument."];
            }
            
            //var angle=arglist[0][1];
            //var realAngle=-angle*Math.PI*2;
            //objres.result=Math.sin(realAngle);
            objres.result=Math.sin((-arglist[0][1] * 360) * (Math.PI/180));
        }
        else if (fname=="cos")
        {
            if (arglist.length!=1)
            {
                return [1,"cos function call without argument."];
            }
            
            //var angle=arglist[0][1];
            //var realAngle=-angle*Math.PI*2;
            //objres.result=Math.cos(realAngle);
            objres.result=Math.cos((arglist[0][1] * 360) * (Math.PI/180));
        }
        else if (fname=="srand")
        {
            // fixme - do nothing for now
        }
        else if ((fname=="t")||(fname=="time"))
        {
            objres.result=this.vcDisplay.time();
        }
        else if (fname=="flr")
        {
            if (arglist.length!=1)
            {
                return [1,"flr requires one argument."];
            }
            
            objres.result=Math.floor(arglist[0][1]);
        }
        else if (fname=="abs")
        {
            if (arglist.length!=1)
            {
                return [1,"abs requires one argument."];
            }
            
            objres.result=Math.abs(arglist[0][1]);
        }
        else if (fname=="max")
        {
            if ((arglist.length!=1)&&(arglist.length!=2))
            {
                return [1,"max requires one or two arguments."];
            }

            var secondParm;
            if (arglist.length==1) secondParm=0;
            else secondParm=arglist[1][1];

            objres.result=Math.max(arglist[0][1],secondParm);
        }
        else if (fname=="min")
        {
            if ((arglist.length!=1)&&(arglist.length!=2))
            {
                return [1,"min requires one or two arguments."];
            }

            var secondParm;
            if (arglist.length==1) secondParm=0;
            else secondParm=arglist[1][1];

            objres.result=Math.min(arglist[0][1],secondParm);
        }
        else if (fname=="bxor")
        {
            if (arglist.length!=2)
            {
                return [1,"bxor requires two arguments."];
            }
        
            var firstParm=arglist[0][1];
            var secondParm=arglist[1][1];

            objres.result=firstParm^secondParm;
        }
        else if (fname=="mid")
        {
            if (arglist.length!=3)
            {
                return [1,"mid requires three arguments."];
            }

            var a=arglist[0][1];
            var b=arglist[1][1];
            var c=arglist[2][1];

            if ((a>=b)&&(a<=c)) objres.result=a;
            if ((a>=c)&&(a<=b)) objres.result=a;
            if ((b>=a)&&(b<=c)) objres.result=b;
            if ((b>=c)&&(b<=a)) objres.result=b;
            if ((c>=a)&&(c<=b)) objres.result=c;
            if ((c>=b)&&(c<=a)) objres.result=c;
        }
        else if (fname=="sqrt")
        {
            if (arglist.length!=1)
            {
                return [1,"sqrt requires one argument."];
            }

            objres.result=Math.sqrt(arglist[0][1]);
        }
        else if (fname=="atan2")
        {
            if (arglist.length!=2)
            {
                return [1,"atan2 requires two arguments."];
            }

            if ((arglist[1][1]==0)&&(arglist[0][1]==0))
            {
                objres.result=0.75;
            }
            else
            {
                var atanRes=Math.atan2(arglist[1][1],-arglist[0][1]);
                atanRes+=Math.PI;
                atanRes/=2*Math.PI;
                objres.result=atanRes;
            }
        }
        else
        {
            return [1,"Unknown function "+fname+"."];
        }

        return [0,"Ok"];
    }

    isNear(v,target)
    {
        var epsilon=0.01;
        if (Math.abs(target-v)<epsilon) return true;
        else return false;
    }

    endCycle(from,to,val,iType)
    {
        if (iType=="I")
        {
            if (val==0) return false;
            return true;
        }

        if (from<to)
        {
            if (val>to)
            {
                return true;
            }
        }
        else if (from>to)
        {
            if (val<to)
            {
                return true;
            }
        }

        return false;
    }

    execute()
    {
        // format: [[blocktype,instrBlockPointer,instructionPC,forend,forstride,forvariable],...]
        var iType=this.pcStack[this.level][0];
        var cycfrom,cycto,cycstride,startingVal;
        var flipped=false;

        if (iType=="I")
        {
            startingVal=0;
            cycfrom=0;
            cycto=1;
            cycstride=1;
        }
        else if (iType=="F")
        {
            var cycleVar=this.pcStack[this.level][5];
            startingVal=this.localScope[cycleVar];
            cycfrom=this.pcStack[this.level][6];
            cycto=this.pcStack[this.level][3];
            cycstride=this.pcStack[this.level][4];
        }

        for (var cvar=startingVal;!this.endCycle(cycfrom,cycto,cvar,iType);cvar+=cycstride)
        {
            var instructions=this.pcStack[this.level][1];

            while (this.pcStack[this.level][2]<instructions.length)
            {
                var element=instructions[this.pcStack[this.level][2]];
                var eltype=element[0][0];
                
                if (eltype=="ASSIGNMENT")
                {
                    var varName;
                    var isArrayAssignment=false;
                    var arrayIndex=0;

                    if (element[0][1][0]=="ARRAYELEMENT")
                    {
                        isArrayAssignment=true;
                        arrayIndex=this.evaluateExpression(element[0][1][2])[1];
                        varName=element[0][1][1][1];
                    }
                    else
                    {
                        varName=element[0][1][1];
                    }
                    
                    var varValue=this.evaluateExpression(element[0][2])[1];
                    // fixme - handle scopes correctly

                    if (varName in this.globalScope)
                    {
                        if (!isArrayAssignment) this.globalScope[varName]=varValue;
                        else this.globalScope[varName][arrayIndex]=varValue;
                    }
                    else if (varName in this.localScope)
                    {
                        if (!isArrayAssignment) this.localScope[varName]=varValue;
                        else this.localScope[varName][arrayIndex]=varValue;
                    }
                    else
                    {
                        if (!isArrayAssignment) this.globalScope[varName]=varValue;
                        else this.globalScope[varName][arrayIndex]=varValue;
                    }
                }
                else if (eltype=="POSTINCREMENT")
                {
                    var varName=element[0][1][1];
                    var varValue=this.evaluateExpression(element[0][2])[1];
                    var incrOperator=element[0][3];

                    if (varName in this.globalScope)
                    {
                        if (incrOperator=="+") this.globalScope[varName]+=varValue;
                        if (incrOperator=="*") this.globalScope[varName]*=varValue;
                    }
                    else if (varName in this.localScope)
                    {
                        if (incrOperator=="+") this.localScope[varName]+=varValue;                        
                        if (incrOperator=="*") this.localScope[varName]*=varValue;                        
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

                    if (funName=="flip") flipped=true;
                }
                else if (eltype=="FOR")
                {
                    var cycleVariable=element[0][1][1];
                    var cycleFrom=this.evaluateExpression(element[0][2])[1];
                    var cycleTo=this.evaluateExpression(element[0][3])[1];
                    
                    var stride;
                    if (element[0][5]!=null) stride=this.evaluateExpression(element[0][5])[1];
                    else stride=1;

                    this.pcStack[this.level][2]+=1; // increment instruction pointer for this level, so it doesn't get stuck when we exit the for loop
                    this.totCycles+=1;

                    this.level+=1;
                    this.localScope[cycleVariable]=cycleFrom;
                    this.pcStack.push(['F',element[0][4],0,cycleTo,stride,cycleVariable,cycleFrom]);
                    this.execute();
                    
                    return;
                }
                else if (eltype=="IF")
                {
                    var expr1=this.evaluateExpression(element[0][1])[1];
                    var expr2=this.evaluateExpression(element[0][2])[1];
                    var relop=element[0][3];

                    if (eval(expr1+relop+expr2))
                    {
                        this.level+=1;
                        this.pcStack.push(['I',element[0][4],0]);
                        this.execute();
                        this.pcStack[this.level][2]+=1;
                        this.totCycles+=1;
                        return;
                    }
                    else
                    {
                        if (element[0][5].length>0)
                        {
                            this.level+=1;
                            this.pcStack.push(['I',element[0][5],0]);
                            this.execute();
                            this.pcStack[this.level][2]+=1;
                            this.totCycles+=1;
                            return;
                        }
                    }
                }
                else if (eltype=="GOTO")
                {
                    // todo: implement goto to labels that are in other levels
                    var gotoLabel=element[0][1][1];
                    for (var ins=0;ins<instructions.length;ins++)
                    {
                        if ((instructions[ins][0][0]=='LABEL')&&(instructions[ins][0][1]==gotoLabel))
                        {
                            this.pcStack[this.level][2]=ins;
                        }
                    }
                }

                this.pcStack[this.level][2]+=1; // increment instruction pointer
                this.totCycles+=1;

                if (flipped)
                {
                    window.setTimeout(this.execute.bind(this),0);
                    //this.execute();
                    return;
                }
            } // end of execution block cycle

            this.pcStack[this.level][2]=0; // reset block of instructions IP

            // if in a cycle, increment cycle variable for future calls.
            if (iType=="F")
            {
                this.localScope[this.pcStack[this.level][5]]+=cycstride;
            }
        }

        if (this.level>0) 
        {
            this.pcStack.pop(); // remove current stack level
            this.level--; // go up one level
            window.setTimeout(this.execute.bind(this),0);
            //this.execute();
            return;
        }
        else
        {
            // execution terminated
        }
    }
}
