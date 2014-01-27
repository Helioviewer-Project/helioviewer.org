#!/usr/bin/tcsh

echo " "
echo "#### "`date`" ####"

setenv PATH "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/var/lib/gems/1.8/bin"

set SCRIPT=`readlink -f "$0"`
set SCRIPTPATH=`dirname "$SCRIPT"`

setenv APP_INCLUDE "$SCRIPTPATH/resque_env.php"
setenv QUEUE "on_demand_movie"
setenv COUNT 6

setenv MOVIE_QUEUE_STATUS "UNKNOWN"


set queues_alive = 0
set arr = `resque list | awk -F" " '{print $1 }'`
set arr_filtered = ''
foreach x ( $arr )
   set q = `echo $x | awk -F":" '{print $3 }' | awk -F" " '{print $1}'`
   if ( $q == $QUEUE ) then
      set arr_filtered = ($arr_filtered `echo $x | awk -F":" '{print $2}'`)
   endif
end

foreach x ( $arr_filtered )
   set process = `ps --no-headers p $x | awk '{print $1}'`
   if ( $?process && $#process > 0 ) then
      @ queues_alive++
   endif
end

if ( $queues_alive < 1 ) then
   setenv MOVIE_QUEUE_STATUS  "STOPPED"
else if ( $queues_alive < `printenv COUNT` ) then
   setenv MOVIE_QUEUE_STATUS "RUNNING DEGRADED"
else if ( $queues_alive < $#arr_filtered ) then
   setenv MOVIE_QUEUE_STATUS "RUNNING DEGRADED"
else if ( $queues_alive == `printenv COUNT` ) then
   setenv MOVIE_QUEUE_STATUS "RUNNING"
else if ( $queues_alive > `printenv COUNT` ) then
   setenv MOVIE_QUEUE_STATUS "RUNNING TOO MANY"
else
   setenv MOVIE_QUEUE_STATUS "UNKNOWN."
endif

printenv MOVIE_QUEUE_STATUS
echo  $queues_alive" of "$#arr_filtered" reported '"$QUEUE"' queues are alive. Total of "`printenv COUNT`" expected."

if ( `printenv MOVIE_QUEUE_STATUS` != "RUNNING" && `printenv MOVIE_QUEUE_STATUS` != "RUNNING TOO MANY") then
   echo "Attempting to gently QUIT each queue, then restart "`printenv COUNT`"."
   foreach x ($arr_filtered)
      set result =  `kill -s QUIT $x`
      echo "kill -s QUIT "$x" "$result
   end
   php $SCRIPTPATH/resque.php
endif

resque list
echo " "

unsetenv MOVIE_QUEUE_STATUS

exit
