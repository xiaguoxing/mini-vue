
let activeEffect
let shouldTrack

export class ReactiveEffect{
  private _fn: any
  deps=[]
  // active判断stop时用
  active=true
  onStop?:()=>void
  public scheduler:Function | undefined

  constructor(fn,scheduler?:Function){
    this._fn=fn
    this.scheduler=scheduler
  }
  run(){

    // 已经stop了
    if(!this.active){
      return this._fn()
    }

    shouldTrack=true
    activeEffect=this

    const result=this._fn()

    shouldTrack=false

    return result
  }
  stop(){
    if(this.active){
      cleanupEffect(this)
      if(this.onStop){
        this.onStop()
      }
      this.active=false
    }
    
    
  }
}

function cleanupEffect(effect){
  effect.deps.forEach((dep:any)=>{
    dep.delete(effect)
  })
  effect.deps.length=0
}

const targetMap=new Map()
export function track(target,key){
   if(!isTracking()) return;

  let depsMap=targetMap.get(target)
  if(!depsMap){
    depsMap=new Map()
    targetMap.set(target,depsMap)
  }

  let dep=depsMap.get(key)
  if(!dep){
    dep=new Set()
    depsMap.set(key,dep)
  }

  trackEffects(dep)
  
}

export function trackEffects(dep){
  // 看看dep之前有没有添加过 添加过的话就不添加了
  if(dep.has(activeEffect)) return;
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function isTracking(){
  return shouldTrack && activeEffect!==undefined
}

export function trigger(target,key){
  let depsMap=targetMap.get(target)
  let dep=depsMap.get(key)

  triggerEffects(dep)
}

export function triggerEffects(dep){
  for(const effect of dep){
    if(effect.scheduler){
      effect.scheduler()
    }else{
      effect.run()
    }
    
  }
}

export function effect(fn,options:any={}){
  // const scheduler=options.scheduler
  const _effect=new ReactiveEffect(fn,options.scheduler)
  
  // _effect.onStop=options.onStop
  Object.assign(_effect,options)
  
  _effect.run()
  const runner:any=_effect.run.bind(_effect)
  runner.effect=_effect
  return runner

}

export function stop(runner){
  runner.effect.stop()
}