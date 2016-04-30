var needed = {};
var cost = 0;

function sanity_check() {
    var litmus = false;
    $.each(heroes, function(hk,hero) {
        $.each(hero.gearsets, function(gk,gearset) {
            $.each(gearset, function(slot,item) {
                if(false === item in gear) {
                    $('#error').html($('#error').html() + 'UNMATCHED GEAR: ' + hk + '/' + gk + '/' + (slot + 1) + '/' + item + '<br />');
                    litmus = true;
                }
            });
        });
        $.each(hero.quests, function(qk,quest) {
            if('gear' === quest.type && false === quest.specific in gear) {
                $('#error').html($('#error').html() + 'UNMATCHED GEAR: ' + hk + '/quest/' + qk + '/' + quest.specific + '<br />');
                litmus = true;
            }
        });
    });
    $.each(recipes, function(rk,recipe) {
        $.each(recipe.materials, function(mk,material) {
            if(false === material.item in gear) {
                $('#error').html($('#error').html() + 'UNMATCHED GEAR: ' + rk + '/' + mk + '/' + material.item + '<br />');
                litmus = true;
            }
        });
    });
    if(false === litmus) {
        $.tablesorter.addParser({
            id: 'nocommas',
            is: function(s) {
                return false;
            },
            format: function(s) {
                return s.toLowerCase().replace(/,/g,'');
            },
            type: 'numeric'
        });
        $('#collects').tablesorter({
            headers: {
                1 : { sorter: 'nocommas' }
            }
        });
        $('#crafts').tablesorter({
            headers: {
                1 : { sorter: 'nocommas' },
                2 : { sorter: 'nocommas' },
                3 : { sorter: 'nocommas' }
            }
        });
        populate_heroes();
        tab('welcome');
        hero_tab('dragon_lady');
    }
}

function populate_heroes() {
    $.each(heroes, function(hk,hero) {
        var nav = '<a class="hero_nav" href="javascript:void(0);" onclick="hero_tab(\'' + hk + '\')"><img class="hero_nav" src="heroes/' + hk + '.png" /></a>';
        $('#heroes_nav').html($('#heroes_nav').html() + nav);
        var result = '';
        result += '<div id="' + hk + '" class="hero_tab">';
        result += '<img class="hero" src="heroes/' + hk + '.png" />';
        result += '<h3>' + hero.name + ' (<span onclick="check_gearsets(\'' + hk + '\', true);">mark as completed</span> &#x2022; <span onclick="check_gearsets(\'' + hk + '\', false);">clear</span>)</h3>';
        result += '<h5>added to the game in v' + hero.version + '</h5>';
        result += '<p class="hero_subnav"><a href="javascript:void(0);" onclick="hero_subtab(\'' + hk + 'gear\')">Gear</a> &#x2022; <a href="javascript:void(0);" onclick="hero_subtab(\'' + hk + 'quests\')">Legendary Quests</a> &#x2022; <a href="javascript:void(0);" onclick="hero_subtab(\'' + hk + 'stats\')">Stats</a></p>';
        result += '<div id="' + hk + 'gear" class="hero_subtab">';
        var progress = $.parseJSON(localStorage.getItem(hk));
        $.each(hero.gearsets, function(gk,gearset) {
            var color = gk.match(/^[^\d]*/)[0];
            result += '<h4 class="' + color + '">' + gk.replace(/(\d+)$/, " +$1") + ' (<span onclick="check_gearset(\'' + hk + gk + '\', true, true);">mark as completed</span> &#x2022; <span onclick="check_gearset(\'' + hk + gk + '\', false, true);">clear</span>)</h4>';
            result += '<ul id="' + hk + gk + '">';
            var i = 1;
            $.each(gearset, function(slot,item) {
                var gear_item = gear[item]
                result += '<li class="inline ' + gear_item.color + '"><label><input type="checkbox" id="' + hk + gk + slot + '" onchange="calculate_gear();"';
                if(null !== progress && gk in progress && slot in progress[gk] && true === progress[gk][slot]) {
                    result += ' checked="checked"';
                }
                result += ' /> ' + gear_item.name + '</label></li>';
                if(3 === i) {
                    result += '<br />';
                }
                i++;
            });
            result += '</ul>';
        });
        result += '</div>';
        result += '<div id="' + hk + 'quests" class="hero_subtab">';
        $.each(hero.quests, function(qk,quest) {
            if('gear' === quest.type) {
                var color = qk.match(/^[^\d]*/)[0];
                var gear_item = gear[quest.specific];
                result += '<h4 class="' + color + '">' + qk.replace(/(\d+)$/, " +$1") + '</h4>';
                result += '<ul><li class="' + gear_item.color + '"><label><input type="checkbox" id="' + hk + 'quest' + qk + '" onchange="calculate_gear();"';
                if(null !== progress && 'quest' in progress && qk in progress['quest'] && true === progress['quest'][qk]) {
                    result += ' checked="checked"';
                }
                result += ' /> ' + quest.quantity + ' ' + gear_item.name + '</label></li></ul>';
            }
        });
        result += '</div>';
        result += '<div id="' + hk + 'stats" class="hero_subtab">';
        result += '</div>';
        result += '</div>';
        $('#heroes_list').html($('#heroes_list').html() + result);
    });
    calculate_gear();
}

function check_gearsets(id,checked) {
    $.each(heroes[id].gearsets, function(gk,gearset) {
        check_gearset(id + gk, checked, false);
    });
    calculate_gear();
}

function check_gearset(id,checked,recalculate) {
    $('#' + id + ' li input').prop('checked', checked);
    if(true === recalculate) {
        calculate_gear();
    }
}

function calculate_gear() {
    needed = {};
    cost = 0;
    var progress = {};
    $('#gold').html(0);
    $.each(heroes, function(hk,hero) {
        progress[hk] = {};
        $.each(hero.gearsets, function(gk,gearset) {
            progress[hk][gk] = {};
            $.each(gearset, function(slot,item) {
                if(false === $('#' + hk + gk + slot).is(':checked')) {
                    progress[hk][gk][slot] = false;
                    if(false === item in needed) {
                        needed[item] = 1;
                    } else {
                        needed[item] += 1;
                    }
                    if(true === item in recipes) {
                        calculate_recipe(recipes[item], 1);
                    }
                } else {
                    progress[hk][gk][slot] = true;
                }
            });
        });
        progress[hk]['quest'] = {};
        $.each(hero.quests, function(qk,quest) {
            if('gear' === quest.type) {
                if(false === $('#' + hk + 'quest' + qk).is(':checked')) {
                    progress[hk]['quest'][qk] = false;
                    if(false === quest.specific in needed) {
                        needed[quest.specific] = quest.quantity;
                    } else {
                        needed[quest.specific] += quest.quantity;
                    }
                    if(true === quest.specific in recipes) {
                        calculate_recipe(recipes[quest.specific], quest.quantity);
                    }
                } else {
                    progress[hk]['quest'][qk] = true;
                }
            }
        });
    });
    $.each(progress, function(k,v) {
        localStorage.setItem(k, JSON.stringify(v));
    });
    var needed_sortable = [];
    $.each(needed, function(k,v) {
        needed_sortable.push({"item" : gear[k], "quantity" : v, "k" : k});
    });
    needed_sortable.sort(function(a,b) {
        var diff = b.quantity - a.quantity;
        if(0 === diff) {
            if(a.item.name < b.item.name) { return(-1); }
            if(a.item.name > b.item.name) { return(1); }
            return(0);
        } else {
            return(diff);
        }
    });
    var collects = '';
    var crafts = '';
    $.each(needed_sortable, function(k,v) {
        if(true === v.k in recipes) {
            r = recipes[v.k];
            crafts += '<tr class="' + v.item.color + '"><td>' + v.item.name + '</td><td>' + commas(v.quantity) + '</td><td>' + commas(r.cost) + '</td><td>' + commas(v.quantity * r.cost) + '</td></tr>';
        } else {
            collects += '<tr class="' + v.item.color + '"><td>' + v.item.name + '</td><td>' + commas(v.quantity) + '</td></tr>';
        }
    });
    $('#collect_list').html(collects);
    $('#craft_list').html(crafts);
    $('table').trigger('update');
}

function commas(raw) {
	return(raw.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"))
}

function calculate_recipe(recipe, quantity) {
    cost += recipe.cost * quantity;
    $('#gold').html(commas(cost)); 
    $.each(recipe.materials, function(k,material) {
        if(false === material.item in needed) {
            needed[material.item] = material.quantity * quantity;
        } else {
            needed[material.item] += material.quantity * quantity;
        }
        if(true === material.item in recipes) {
            calculate_recipe(recipes[material.item], material.quantity * quantity);
        }
    });
}

function reset() {
    if(true === confirm('Are you sure?')) {
        $('input').prop('checked', false);
    }
    calculate_gear();
}

function tab(id) {
    $('.tab').hide();
    $('#' + id).show();
}

function hero_tab(id) {
    $('.hero_subtab').hide();
    $('.hero_tab').hide();
    $('#' + id).show();
    $('#' + id + 'gear').show();
}

function hero_subtab(id) {
    $('.hero_subtab').hide();
    $('#' + id).show();
}

$(function() { sanity_check(); });
