/**
 * Youama Pert Chrome App
 *
 * @version 1.0
 * @link www.youama.com
 * @live pert.youama.com
 * @documentation www.youama.com/pert-chrome-app
 * @author David Belicza
 * @package jQuery/pertEvaluate
 */

(function($) {

    $.fn.pertEvaluate = function(options) {

        var lines = new Array();

        var lineHtml = '';

        var results = new Array();

        var sequences = new Array();

        var errors = false;

        var stop = false;

        var savedUrl = '';

        return start();

        function start() {
            lineHtml = $('.base').html();
            eventListeners();

            if (getUrlVar("load") != null) {
                autoLoader();
            }
        }

        function reset() {
            lines = new Array();
            results = new Array();
            sequences = new Array();
            errors = false;
        }

        function eventListeners() {
            $('.ok').click(function(){
                if (stop != true) {
                    stop = true;
                    validate();
                    if (errors != true) {
                        reset();
                        hookValues();
                        calculate();
                        refreshLayout();
                    }
                    stop = false;
                }
                return false;
            });

            $('.pert').on('click', '.plus', function(){
                addPlusLine();
            });

            $('.pert').on('click', '.minus', function(){
                removePlusLine($(this));
            });

            $('.pert').on('keypress', '.float', function(event){
                if ((event.which != 46 || $(this).val().indexOf(',') != -1)
                    && (event.which < 48 || event.which > 57)) {
                    event.preventDefault();
                }
            });

            $('.pert').on('keypress', '.item-title', function(event){
                if (event.which == 36 || //'$'
                    event.which == 38 || //'&'
                    event.which == 43 || //'+'
                    event.which == 46) { //'.'
                    event.preventDefault();
                }
            });
        }

        function validate() {
            errors = false;

            $('.float').each(function(){
                if (errors == true) return;
                currentValue = $(this).children('input').val();
                if (currentValue == '') {
                    errors = true;
                    alert('Please fill out all fields or remove unused lines');
                    return;
                }
                if (currentValue == '0' || currentValue == 0) {
                    errors = true;
                    alert('Evaluate can not be zero');
                    return;
                }
            });
        }

        function hookValues() {
            $('.pert .line').each(function(i) {
                var currentValues = new Array();
                currentValues['optimistic'] = parseFloat($(this)
                    .children('.optimistic').children('input').val()
                    .replace(/,/g, '.'));
                currentValues['normal'] = parseFloat($(this)
                    .children('.normal').children('input').val()
                    .replace(/,/g, '.'));
                currentValues['pessimistic'] = parseFloat($(this)
                    .children('.pessimistic').children('input').val()
                    .replace(/,/g, '.'));
                lines[i] = currentValues;
            });
        }

        function calculate() {
            for (var i = 0; i < lines.length; i++) {
                var resultsTemp = new Array();
                resultsTemp['u'] = (lines[i]['optimistic']
                    + (4 * lines[i]['normal']) + lines[i]['pessimistic']) / 6;
                resultsTemp['o'] = (lines[i]['pessimistic']
                    - lines[i]['optimistic']) / 6;
                results[i] = resultsTemp;
            }

            var uSequence = 0;
            var oSequenceTemp = 0;
            for (var i = 0; i < results.length; i++) {
                uSequence = uSequence + results[i]['u'];
                oSequenceTemp = oSequenceTemp + (results[i]['o']
                    * results[i]['o']);
            }

            var oSequence = Math.pow(oSequenceTemp, 0.5);

            sequences['u'] = uSequence;
            sequences['o'] = oSequence;
            sequences['result'] = uSequence + oSequence;

            autoSave();
        }

        function refreshLayout() {
            $('.pert .line').each(function(i) {
                $(this).children('.u').children('p').text(results[i]['u'].toFixed(1));
                $(this).children('.o').children('p').text(results[i]['o'].toFixed(1));
            });

            $('.result .evaluation span').text(sequences['u'].toFixed(1));
            $('.result .uncertainty span').text(sequences['o'].toFixed(1));
            $('.result .finalresult .value').text(sequences['result'].toFixed(1) + ' hours');

            $('body').animate({
                    scrollTop: $('.result').offset().top
                }, {
                    queue: false,
                    duration: 2000,
                    easing: 'easeInOutCirc',
                    complete: function () {
                        $('.finalresult .value')
                            .effect('shake', {times:4}, 1000);
                    }
                }
            );
        }

        function addPlusLine() {
            $('.line').last().after('<div class="line">' + lineHtml + '</div>');
            $('body').delay(100).stop(true, true).animate({
                    scrollTop: $('.line').last().offset().top
                }, {
                    queue: false,
                    duration: 1000,
                    easing: 'easeOutCirc'
                }
            );

        }

        function removePlusLine(removeDiv) {
            removeDiv.parent('.fields').parent('.line').remove();
        }

        function autoSave() {
            var title = '';
            var optimistic = '';
            var normal = '';
            var pessimistic = '';

            $('.pert .line').each(function() {
                if (title.length != 0) title += '$';
                var currentTitle = $(this).children('.item-title').children('input').val();
                if (currentTitle == '' || currentTitle == null) currentTitle = '_';
                title += encodeURIComponent(currentTitle);
                if (optimistic.length != 0) optimistic += '$';
                optimistic += $(this).children('.optimistic').children('input').val();
                if (normal.length != 0) normal += '$';
                normal += $(this).children('.normal').children('input').val();
                if (pessimistic.length != 0) pessimistic += '$';
                pessimistic += $(this).children('.pessimistic').children('input').val();
            });

            savedUrl = '?load=1&title=' + title + '&opt=' + optimistic + '&nor='
                + normal + '&pes=' + pessimistic;

            window.history.pushState(null, "", savedUrl);
            $('.pert .description p a').attr('href', 'http://polaris-evaluation-calculator.youama.com/' + savedUrl);
            $('.pert .description p a').fadeIn();
        }

        //http://localhost/cloud/pert/?load=1&title=Els%C5%91$M%C3%A1sodik&opt=5.5$1&pes=2$3&nor=9$4
        function autoLoader() {
            var items = new Array();
            var title = getUrlVar('title');

            if (title != null) {
                var titles = new Array();
                titles = title.split('$');
                items['titles'] = titles;
                titles = null;
            }

            var pes = getUrlVar('pes');
            var opt = getUrlVar('opt');
            var nor = getUrlVar('nor');

            if (pes != null && opt != null &&
                nor != null) {
                var pess = new Array();
                var opts = new Array();
                var nors = new Array();

                pess = pes.split('$');
                items['pess'] = pess;
                opts = opt.split('$');
                items['opts'] = opts;
                nors = nor.split('$');
                items['nors'] = nors;

                var pess = null;
                var opts = null;
                var nors = null;
            }

            for (var i in items['nors']) {
                if (i != 0) $('.base .plus').trigger('click');

                $('.pert .line').last().children('.item-title')
                    .children('input').val(decodeURIComponent(items['titles'][i]));

                $('.pert .line').last().children('.optimistic')
                    .children('input').val(items['opts'][i]);

                $('.pert .line').last().children('.normal')
                    .children('input').val(items['nors'][i]);

                $('.pert .line').last().children('.pessimistic')
                    .children('input').val(items['pess'][i]);
            }

            $('.ok-wrap .ok').trigger('click');
        }

        function getUrlVars() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        }

        function getUrlVar(name){
            return getUrlVars()[name];
        }
    }
})(jQuery);