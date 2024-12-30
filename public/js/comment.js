document.addEventListener('DOMContentLoaded', function() {
    // Get content type and slug from the current URL
    const pathParts = window.location.pathname.split('/');
    const contentType = pathParts[1]; // 'blogs' or 'recipes'
    const contentSlug = pathParts[2];

    // Edit Comment
    document.querySelectorAll('.edit-comment').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const comment = this.closest('.comment');
            const content = comment.querySelector('.comment__text');
            const form = comment.querySelector('.comment__edit-form');
            const textarea = form.querySelector('.comment__edit-input');

            content.style.display = 'none';
            form.style.display = 'block';
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });
    });

    // Submit Edit
    document.querySelectorAll('.comment__edit-form').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const comment = this.closest('.comment');
            const commentId = comment.dataset.commentId;
            const content = this.querySelector('.comment__edit-input').value.trim();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            if (!content) {
                alert('Comment cannot be empty');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                const response = await fetch(`/${contentType}/${contentSlug}/comment/edit?id=${commentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to update comment');
                }

                const contentElement = comment.querySelector('.comment__text');
                contentElement.textContent = content;
                contentElement.style.display = 'block';
                this.style.display = 'none';

                const timestampElement = comment.querySelector('.comment__date');
                if (timestampElement) {
                    timestampElement.textContent = `Updated ${formatDate(data.comment.updatedAt)}`;
                }

            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Failed to update comment');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    });

    // Delete Comment
    document.querySelectorAll('.delete-comment').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to delete this comment?')) {
                return;
            }

            const comment = this.closest('.comment');
            const commentId = comment.dataset.commentId;
            const originalText = this.innerHTML;

            try {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                this.disabled = true;

                const response = await fetch(`/${contentType}/${contentSlug}/comment/delete?id=${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to delete comment');
                }

                comment.style.opacity = '0';
                setTimeout(() => {
                    comment.remove();
                    
                    const countElement = document.querySelector('.content-detail__section-title');
                    if (countElement) {
                        const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
                        countElement.textContent = countElement.textContent.replace(
                            /\d+/,
                            (currentCount - 1).toString()
                        );
                    }
                }, 300);

            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Failed to delete comment');
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    });
});

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 