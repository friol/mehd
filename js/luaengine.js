/* lua engine - parser and execution engine */

class luaengine
{
    constructor(vcdisplay)
    {
        var tempGrammar=document.getElementById("luaGrammar").innerText;
        this.parsetree=null;
        this.vcDisplay=vcdisplay;

        try
        {
            this.parser=peg.generate(tempGrammar);
        }
        catch(e)
        {
            alert("Exception parsing internal LUA grammar ["+e.toString()+"]");
        }
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
            var result=this.execute(this.parsetree,[],[],0);
            return result;
        }
        catch(e)
        {
            alert("Error parsing code: ["+e.toString()+"]");
            return 0;
        }
    }

    evaluateExpression(e,localScope,globalScope)
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
        else if ((typeof e=='object')&&(e.length>0)&&(e[0]=='VARIABLE'))
        {
            var variableName=e[1];

            // search variable name in local/global scope

            if (variableName in localScope)
            {
                if (typeof localScope[variableName]=='string')
                {
                    return ['STRING',localScope[variableName]];
                }
                else if (typeof localScope[variableName]=='number')
                {
                    return ['NUMBER',localScope[variableName]];
                }
            }
            else if (variableName in globalScope)
            {
                if (typeof globalScope[variableName]=='string')
                {
                    return ['STRING',globalScope[variableName]];
                }
                else if (typeof globalScope[variableName]=='number')
                {
                    return ['NUMBER',globalScope[variableName]];
                }
            }
        }
        else if (typeof e === 'object')
        {
            if (e.operator=="+")
            {
                return ['NUMBER',this.evaluateExpression(e.left,localScope,globalScope)[1]+this.evaluateExpression(e.right,localScope,globalScope)[1]];
            }
            else if (e.operator=="-")
            {
                return ['NUMBER',this.evaluateExpression(e.left,localScope,globalScope)[1]-this.evaluateExpression(e.right,localScope,globalScope)[1]];
            }
            else if (e.operator=="*")
            {
                return ['NUMBER',this.evaluateExpression(e.left,localScope,globalScope)[1]*this.evaluateExpression(e.right,localScope,globalScope)[1]];
            }
            else if (e.operator=="\/")
            {
                return ['NUMBER',this.evaluateExpression(e.left,localScope,globalScope)[1]*this.evaluateExpression(e.right,localScope,globalScope)[1]];
            }
        }
    }

    execFunctionCall(fname,arglist)
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
            // do nothing (for now)
        }
        else if (fname=="logprint")
        {
            var msg=arglist[0][1];
            alert(msg);
        }
        else
        {
            return [1,"Unknown function "+fname+"."];
        }

        return [0,"Ok"];
    }

    execute(instructions,localScope,globalScope,level)
    {
        var l=instructions.length;

        for (const element of instructions)
        {
            var eltype=element[0][0];
            
            if (eltype=="COMMENT")
            {
                // pass
            }
            else if (eltype=="ASSIGNMENT")
            {
                var varName=element[0][1];
                var varValue=this.evaluateExpression(element[0][2],localScope,globalScope);
                if (level==0)
                {
                    globalScope[varName]=varValue;
                }
            }
            else if (eltype=="FUNCTIONCALL")
            {
                var funName=element[0][1];
                var funArgList=element[0][2];

                if (funArgList!=null)
                {
                    var arglistType=funArgList[0];
                    if (arglistType!="FUNARGLIST")
                    {
                        return "Error: no FUNARGLIST in function call.";
                    }

                    var argList=funArgList[1];
                    var parsedArgList=[];
                    argList.forEach(arg =>
                        {
                            parsedArgList.push(this.evaluateExpression(arg,localScope,globalScope));
                        }
                    );

                    var ret=this.execFunctionCall(funName,parsedArgList);
                    if (ret[0]!=0) 
                    {
                        return ret[1];
                    }
                }
            }
            else if (eltype=="FOR")
            {
                var cycleVariable=element[0][1];
                var cycleFrom=this.evaluateExpression(element[0][2],localScope,globalScope)[1];
                var cycleTo=this.evaluateExpression(element[0][3],localScope,globalScope)[1];

                localScope.cycleVariable=0;
                for (var i=cycleFrom;i<=cycleTo;i++)
                {
                    localScope.cycleVariable=i;
                    this.execute(element[0][4],localScope,globalScope,level+1);
                }
            }
        }

        return "Execution ok.";
    }
}
