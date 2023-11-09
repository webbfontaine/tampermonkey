// ==UserScript==
// @name         Adding Root Cause dropdown to OpsGenie PostMortem form
// @namespace    https://webbfontaine.atlassian.net/wiki/spaces/IPM/pages/43090048/OpsGenie+add+Root+Cause+dropdown+to+PostMortems
// @version      0.2
// @description  Adding Root Cause dropdown to OpsGenie PostMortem form
// @author       Vahe Momjyan / Eric chauvin
// @match        https://webbfontaine.app.eu.opsgenie.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webbfontaine.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const rootURL = "https://opsgenie.webbfontaine.com";

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            urlRouter(url);
        }
    }).observe(document, {subtree: true, childList: true});

    const regex = /(https:\/\/webbfontaine\.app\.eu\.opsgenie\.com\/reports\/post-mortem\/)([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(\/detail)/i;

    let postmoretemId;

    function urlRouter(url) {
        console.log('URL changed!', url);

        let m;

        if ((m = regex.exec(url)) !== null) {
            // The result can be accessed through the `m`-variable.
            postmoretemId = m[2];
            loadAndAddDropdown();
            loadStatus();
        }else{
            postmoretemId = null;
        }
    }

    function loadAndAddDropdown() {

        const continerDiv = document.querySelector(".post-mortem-container__right .details-tab");

        if(!continerDiv){
            setTimeout(loadAndAddDropdown, 1000);
            return;
        }

        continerDiv.insertAdjacentHTML('beforeend', '' +
                               '<div class="section">'+
                               '<div class="section__title">Root cause</div>' +
                               '<div class="section__body full-story-hidden"><div class="RootWrapper-sc-1va80k6-0 fsVJT"><div style="position: absolute;"><label class="Label__LabelWrapper-sc-17towfw-0 keOXhT">'+
                               '<div class="Label__LabelInner-sc-17towfw-1 jbyPaz"><span></span></div></label></div><div class="ContentWrapper-kdagst-0 fPLsyX"><div class="FieldBaseWrapper-sc-14kmybr-0 cspqsP">'+
                               '<div class="Content__ContentWrapper-ve26fj-2 feWTNh"><div class="Content__ChildWrapper-ve26fj-0 ilJUcG"><div class="Content-ve26fj-1 llCsQv">'+
                               '<div class="ReadViewContentWrapper-xymwx5-0 kLiHRY">'+
                               '<div><select id="rootCauseSelect"><option value="-1">Please select a root cause</option></select></div></div></div></div></div></div></div></div></div></div>');

        const select = document.querySelector("#rootCauseSelect");

        fetch(`${rootURL}/postmortem/${postmoretemId}/root-causes`)
            .then(function(response) {
            return response.json();
        })
            .then(function(json) {
                json.groups.forEach(
                    grp => {
                        console.log(grp);
                        var optgrp = document.createElement('optgroup');
			var name = grp.name;
			if(!name){
			   name = grp.serviceName
			}
                        optgrp.label = name;

                        select.appendChild(optgrp);
                        grp.values.forEach(val => {
                            var opt = document.createElement('option');
                            opt.value = val.id;
                            opt.innerHTML = val.rootCause;
                            if(val.selected)opt.selected = "selected";
                            optgrp.appendChild(opt);
                        });
                    }
                )
            select.onchange = function(element){
                submitRootCause(element.target.value, postmoretemId);
            };
        });

    }

    function submitRootCause(rootCauseId, postmortemId){
        fetch(`${rootURL}/postmortem/${postmortemId}/root-causes`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: rootCauseId})
        }).then(res => res)
        .then(res => console.log(res));
    }

    function toggleState(statusText){
        const select = document.querySelector("#rootCauseSelect");

            switch(statusText){
                case "Published" : {
                    select.setAttribute("disabled", "disabled");
                    break;
                }
                default:{
                    select.removeAttribute("disabled");
                }
            }
    }

    function observeChanges(target){
        console.log(target);

        // Options for the observer (which mutations to observe)
        var config = { attributes: true, childList: true, subtree:true };

        // Callback function to execute when mutations are observed
        var callback = function(mutationsList) {
            const statusDropdown = document.querySelector(".status-dropdown button span:nth-child(1)");
            toggleState(statusDropdown.innerText);
        };

        // Create an observer instance linked to the callback function
        var observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        observer.observe(target, config);
    }

    function loadStatus() {
        const statusDropdown = document.querySelector(".status-dropdown button span:nth-child(1)")

        if(!statusDropdown){
            setTimeout(loadStatus, 1000);
            return;
        }

        const statusText = statusDropdown.innerText;

        toggleState(statusText);

        observeChanges(document.querySelector(".status-dropdown button"));
    }

    urlRouter(location.href);

    addGlobalStyle('[name=description] {  resize: vertical ! important;}');
    addGlobalStyle('#rootCauseSelect { color: coral ! important; padding-left: 7px ! important; text-overflow: ellipsis ! important;}');

})();
