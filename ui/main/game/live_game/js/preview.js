
window.preview = (function () {
	var timerId = null, shownOnElement = null;

	$('body').on('mouseleave', function() { preview.hide() }); // clean up previews we accidentally leave behind, just in case

	return {
		show: function(target, placement) {
			if (timerId)
				return;

			if (shownOnElement === placement.element)
				return;

			var
				$e = $(placement.element),
				elementOffset = $e.offset(),
				offsetX = elementOffset.left + (placement.offset ? placement.offset[0] : 0),
				offsetY = elementOffset.top + (placement.offset ? placement.offset[1] : 0),
				alignX = (placement.alignElement ? placement.alignElement[0] : 0),
				alignY = (placement.alignElement ? placement.alignElement[1] : 0),
				request = {
					target: target,
					placement: {
						offset: [
							offsetX + alignX * placement.element.offsetWidth,
							offsetY + alignY * placement.element.offsetHeight
						],
						alignDeck: placement.alignDeck,
						panelName: api.Panel.pageName
					}
				},
				slideshow = function() {
                    api.Panel.message(api.Panel.parentId, 'preview.show', request);

					if (placement.slideshowDelay) {
						timerId = window.setTimeout(slideshow, placement.slideshowDelay);
					}
				};

			shownOnElement = placement.element;
			$(shownOnElement).on('mouseleave', preview.hide);
			slideshow( );
		},
		jump: function(target, holodeck) {
			/* an explicit request to show a preview immediately in a pip */
			if (target && holodeck) {
				api.Panel.message(api.Panel.parentId, 'preview.show', {
					target: target,
					placement: { holodeck: holodeck }
				});
			}
		},
		hide: function() {
            api.Panel.message(api.Panel.parentId, 'preview.hide');
			if (timerId) {
				window.clearTimeout(timerId);
				timerId = null;
			}
			if (shownOnElement) {
				$(shownOnElement).off('mouseleave', preview.hide);
            	shownOnElement = null;
			}
		},
		injectClipHandler: function(handlers, positionError) {
			/*
				Holodecks are always behind UI. In principle we could change this, but as of 7-27-2015 we have literally one panel that we
				occasionally want to have appear behind a holodeck. This hack exploits css clip paths to make it look like the preview
				holodeck is in front of another panel.
			*/

			api.Panel.message(api.Panel.parentId, 'preview.panel_will_clip', { panel_name: api.Panel.pageName });

			handlers['preview.clip'] = function(payload) {
				var gap = payload.gap;

				if (positionError) {
					/* this is a dreadful hack-in-a-hack around panel positioning -- the build bar panel gets bumped slightly */
					gap[0] += positionError[0];
					gap[1] += positionError[1];
				}

				clipPath = payload.visible ? clipTo(gap[0] + 'px', gap[1] + 'px', (gap[0] + gap[2]) + 'px', (gap[1] + gap[3]) + 'px') : '';

				$('body').css('-webkit-clip-path', clipPath);
			}

			function clipTo(x1, y1, x2, y2) {
				return "polygon(0 0, 0 100%, " + x1 + " 100%, " + x1 + " " + y1 + ", " + x2 + " " + y1 + ", " + x2 + " " + y2 + ", " + x1 + " " + y2 + ", " + x1 + " 100%, 100% 100%, 100% 0)"
			}
		}
	};
})();
